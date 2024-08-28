import { Arg, Authorized, Ctx, Mutation, Query, Resolver } from 'type-graphql'
import DefaultRoute from '../decorators/DefaultRoute'
import { Context, Session } from '@project-manager/shared/graphql'

@Resolver()
class SessionResolver {
  @Mutation(() => Session)
  @DefaultRoute('session')
  async createSession(@Ctx() ctx: Context, @Arg('name', { nullable: true }) name: string) {}

  @Query(() => Session)
  @Authorized()
  async getSession(@Ctx() ctx: Context) {
    return ctx.session
  }
}

export default SessionResolver
