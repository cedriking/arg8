import { ArgsType, Field, ID, InputType, Int, ObjectType, registerEnumType } from 'type-graphql'

enum TagOperator {
  EQ = 'EQ',
  NEQ = 'NEQ',
}

enum SortOrder {
  HEIGHT_ASC = 'HEIGHT_ASC',
  HEIGHT_DESC = 'HEIGHT_DESC',
}

@ArgsType()
class GetTransactionArgs {
  @Field(() => ID)
  public id: string
}

@ArgsType()
class GetBlockArgs {
  @Field(() => ID, { nullable: true })
  public id: string | undefined
}

@InputType()
class TagFilter {
  @Field(() => String)
  public name: string

  @Field(() => [String])
  public values: string[]

  @Field(() => TagOperator, { defaultValue: TagOperator.EQ })
  public op: TagOperator
}

@InputType()
class BlockFilter {
  @Field(() => Int, { nullable: true })
  public min: number | undefined

  @Field(() => Int, { nullable: true })
  public max: number | undefined
}

@ObjectType()
class PageInfo {
  @Field(() => Boolean)
  public hasNextPage: boolean
}

@ObjectType()
class Amount {
  @Field(() => String)
  public winston: string

  @Field(() => String)
  public ar: string
}

@ObjectType()
class MetaData {
  @Field(() => String)
  public size: string

  @Field(() => String)
  public type: string
}

@ObjectType()
class Block {
  @Field(() => ID)
  public id: string

  @Field(() => Int)
  public timestamp: number

  @Field(() => Int)
  public height: number

  @Field(() => ID)
  public previous: string
}

@ObjectType()
class Owner {
  @Field(() => String)
  public address: string

  @Field(() => String)
  public key: string
}

@ObjectType()
class Tag {
  @Field(() => String)
  public name: string

  @Field(() => String)
  public value: string
}

@ObjectType()
class Parent {
  @Field(() => ID)
  public id: string
}

@ObjectType()
class Bundle {
  @Field(() => ID)
  public id: string
}

@ObjectType()
class BlockConnection {
  @Field(() => PageInfo)
  public pageInfo: PageInfo

  @Field(() => [BlockEdge])
  public edges: BlockEdge[]
}

@ObjectType()
class BlockEdge {
  @Field(() => String)
  public cursor: string

  @Field(() => Block)
  public node: Block
}

@ObjectType()
class Transaction {
  @Field(() => ID)
  public id: string

  @Field(() => String)
  public anchor: string

  @Field(() => String)
  public signature: string

  @Field(() => String)
  public recipient: string

  @Field(() => Owner)
  public owner: Owner

  @Field(() => Amount)
  public fee: Amount

  @Field(() => Amount)
  public quantity: Amount

  @Field(() => MetaData)
  public data: MetaData

  @Field(() => [Tag])
  public tags: Tag[]

  @Field(() => Block, { nullable: true })
  public block: Block | undefined

  @Field(() => Parent, { nullable: true })
  public parent: Parent | undefined

  @Field(() => Bundle, { nullable: true })
  public bundledIn: Bundle | undefined
}

@ObjectType()
class TransactionConnection {
  @Field(() => PageInfo)
  public pageInfo: PageInfo

  @Field(() => [TransactionEdge])
  public edges: TransactionEdge[]
}

@ObjectType()
class TransactionEdge {
  @Field(() => String)
  public cursor: string

  @Field(() => Transaction)
  public node: Transaction
}

@ArgsType()
class GetTransactionsArgs {
  @Field(() => [ID], { nullable: true })
  public ids: string[] | undefined

  @Field(() => [String], { nullable: true })
  public owners: string[] | undefined

  @Field(() => [String], { nullable: true })
  public recipients: string[] | undefined

  @Field(() => [TagFilter], { nullable: true })
  public tags: TagFilter[] | undefined

  @Field(() => [ID], { nullable: true })
  public bundledIn: string[] | undefined

  @Field(() => Int, { nullable: true, defaultValue: 10 })
  public first: number = 10

  @Field(() => String, { nullable: true })
  public after: string | undefined

  @Field(() => SortOrder, { nullable: true })
  public sort: SortOrder | undefined
}

@ArgsType()
class GetBlocksArgs {
  @Field(() => [ID], { nullable: true })
  public ids: string[] | undefined

  @Field(() => BlockFilter, { nullable: true })
  public height: BlockFilter | undefined

  @Field(() => Int, { nullable: true, defaultValue: 10 })
  public first: number = 10

  @Field(() => String, { nullable: true })
  public after: string | undefined

  @Field(() => SortOrder, { nullable: true, defaultValue: SortOrder.HEIGHT_ASC })
  public sort: SortOrder = SortOrder.HEIGHT_ASC
}

registerEnumType(TagOperator, {
  name: 'TagOperator',
})

registerEnumType(SortOrder, {
  name: 'SortOrder',
})

export {
  MetaData,
  Amount,
  Transaction,
  Block,
  Owner,
  Tag,
  Parent,
  Bundle,
  GetTransactionArgs,
  GetTransactionsArgs,
  GetBlockArgs,
  GetBlocksArgs,
  TagFilter,
  BlockFilter,
  TransactionConnection,
  BlockConnection,
  TagOperator,
  SortOrder,
  PageInfo,
  BlockEdge,
  TransactionEdge,
}
