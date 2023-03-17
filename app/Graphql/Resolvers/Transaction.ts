import { DatabaseQueryBuilderContract } from '@ioc:Adonis/Lucid/Database'
import Transaction from 'App/Models/Transaction'
import { encodeCursor, newCursor, parseCursor } from 'App/Helpers/Cursor'
import { atob, btoa } from 'App/Helpers/Utils'
import Blockweave from 'blockweave'
import { Args, Query, Resolver } from 'type-graphql'
import {
  Transaction as SDLTransaction,
  GetTransactionArgs,
  TransactionConnection,
  GetTransactionsArgs,
  TagOperator,
  SortOrder,
} from '../Types'

type QueryParams = Partial<
  GetTransactionArgs & GetTransactionsArgs & { offset: number; timestamp: string; limit: number }
>
@Resolver()
export default class TransactionResolver {
  private MAX_PAGE_SIZE = 100
  private blockweave = new Blockweave(
    {
      url: 'https://arweave.net',
    },
    ['https://arweave.net']
  )

  @Query(() => SDLTransaction, { nullable: true })
  public async transaction(
    @Args() { id }: GetTransactionArgs
  ): Promise<SDLTransaction | undefined> {
    const [result] = await this.generateQuery({ id })
    if (!result) {
      return undefined
    }

    return this.convertToSDLTransaction(result)
  }

  @Query(() => TransactionConnection)
  public async transactions(
    @Args() { after, first = 10, ...others }: GetTransactionsArgs
  ): Promise<TransactionConnection> {
    const { timestamp, offset } = parseCursor(after || newCursor())
    // prevent limit higher than the max
    const pageSize = Math.min(first, this.MAX_PAGE_SIZE)
    const params = {
      ...others,
      limit: pageSize + 1,
      offset,
    }
    const results = await this.generateQuery(params)
    const hasNextPage = results.length > pageSize
    return {
      pageInfo: {
        hasNextPage,
      },
      edges: (() => {
        return results.slice(0, pageSize).map((result, index) => ({
          cursor: encodeCursor({ timestamp, offset: offset + index + 1 }),
          node: this.convertToSDLTransaction(result),
        }))
      })(),
    }
  }

  private async generateQuery(params: QueryParams): Promise<DatabaseQueryBuilderContract> {
    const { id, ids, owners, recipients, tags, bundledIn, limit = 10, sort, offset = 0 } = params
    const query = Transaction.query()
      .select()
      .preload('tags')
      .join('wallets', 'transactions.wallet_id', 'wallets.id')
      .join('blocks', 'transactions.block_id', 'blocks.id')

    if (id) {
      query.where('transactions.txid', id)
    }

    if (ids) {
      query.whereIn('transactions.txid', ids)
    }

    if (recipients) {
      query.whereIn('transactions.target', recipients)
    }

    if (owners) {
      query.whereIn('wallets.address', owners)
    }

    if (tags) {
      tags.forEach(({ name, values, op }) => {
        query.whereHas('tags', (tag) => {
          const b64Name = btoa(name).replace(/(=)/g, '')
          const b64Values = values.map((value) => btoa(value).replace(/(=)/g, ''))

          if (op === TagOperator.EQ) {
            tag.where('name', b64Name).andWhereIn('value', b64Values)
          }

          if (op === TagOperator.NEQ) {
            tag.where('name', b64Name).andWhereNotIn('value', b64Values)
          }
        })
      })
    }
    if (bundledIn) {
      query.whereIn('transactions.bundled_in', bundledIn)
    }

    query.limit(limit).offset(offset)
    if (sort) {
      if (sort === SortOrder.HEIGHT_ASC) {
        query.orderBy('blocks.height', 'asc')
      } else if (sort === SortOrder.HEIGHT_DESC) {
        query.orderBy('blocks.height', 'desc')
      } else {
        query.orderBy('transactions.created_at', 'desc')
      }
    }

    return query
  }

  private convertToSDLTransaction(result: any): SDLTransaction {
    const { $attributes, $preloaded, $extras } = result
    const { lastTx, txid, bundledIn, signature, dataSize, contentType, reward, quantity, target } =
      $attributes
    const {
      address,
      owner,
      indep_hash: indepHash,
      previous_block: previousBlock,
      timestamp,
      height,
    } = $extras
    const { tags = [] } = $preloaded
    const trx: SDLTransaction = {
      anchor: lastTx,
      id: txid,
      bundledIn: bundledIn && {
        id: bundledIn,
      },
      parent: bundledIn && {
        id: bundledIn,
      },
      signature: signature,
      data: {
        size: (dataSize || 0).toString(),
        type: contentType || '',
      },
      fee: {
        winston: reward.toString(),
        ar: this.blockweave.ar.winstonToAr(reward.toString()),
      },
      quantity: {
        winston: quantity.toString(),
        ar: this.blockweave.ar.winstonToAr(quantity.toString()),
      },
      owner: {
        address,
        key: owner,
      },
      recipient: target,
      block: {
        height,
        id: indepHash,
        previous: previousBlock,
        timestamp: new Date(timestamp).getTime() / 1000,
      },
      tags: tags.map((tag) => ({
        name: atob(tag.$attributes.name),
        value: atob(tag.$attributes.value),
      })),
    }

    return trx
  }
}
