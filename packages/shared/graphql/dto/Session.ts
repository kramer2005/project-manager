import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class Session {
  
  @Field()
  id: string;

  @Field()
  name: string;

}