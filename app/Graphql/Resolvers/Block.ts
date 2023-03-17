import { DatabaseQueryBuilderContract } from '@ioc:Adonis/Lucid/Database'
import { DateTime } from 'luxon'
import Block from 'App/Models/Block'
import {
  Block as SDLBlock,
  BlockConnection,
  GetBlockArgs,
  GetBlocksArgs,
  SortOrder,
} from '../Types'
import { Args, Query, Resolver } from 'type-graphql'
import { encodeCursor, newCursor, parseCursor } from 'App/Helpers/Cursor'

type QueryParams = Partial<GetBlockArgs & GetBlocksArgs & { offset: number; limit: number }>

@Resolver()
export default class BlockResolver {
  private MAX_PAGE_SIZE = 10

  @Query(() => SDLBlock, { nullable: true })
  public async block(@Args() { id }: GetBlockArgs): Promise<SDLBlock | undefined> {
    const [result] = await this.generateQuery({ id })
    if (!result) {
      return undefined
    }

    return this.convertToSDLBlock(result)
  }

  @Query(() => BlockConnection)
  public async blocks(
    @Args() { after, first = 10, ...others }: GetBlocksArgs
  ): Promise<BlockConnection> {
    const { timestamp, offset } = parseCursor(after || newCursor())
    // prevent limit higher than the max limit
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
          node: this.convertToSDLBlock(result),
        }))
      })(),
    }
  }

  private async generateQuery(params: QueryParams): Promise<DatabaseQueryBuilderContract> {
    const { id, ids, height, limit = 10, offset = 0, sort = SortOrder.HEIGHT_DESC } = params
    const query = Block.query().select()
    if (id) {
      query.where('blocks.indep_hash', id)
    }

    if (ids) {
      query.whereIn('blocks.indep_hash', ids)
    }

    if (height?.min && height.min >= 0) {
      query.where('blocks.height', '>=', height.min)
    }

    if (height?.max && height.max >= 0) {
      query.where('blocks.height', '<=', height.max)
    }

    query.limit(limit).offset(offset)

    if (sort === SortOrder.HEIGHT_ASC) {
      query.orderBy('blocks.height', 'asc')
    } else {
      query.orderBy('blocks.height', 'desc')
    }

    return query
  }

  private convertToSDLBlock(result: any): SDLBlock {
    const {
      $attributes: { indepHash, height, previousBlock, timestamp },
    } = result
    return {
      id: indepHash,
      height,
      previous: previousBlock,
      timestamp: (timestamp as DateTime).toUnixInteger(),
    }
  }
}
