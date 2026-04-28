import { salonResolvers } from './salonResolvers';
import { bookingResolvers } from './bookingResolvers';
import { reviewResolvers } from './reviewResolvers';
import { userResolvers } from './userResolvers';

export const resolvers = {
  Query: {
    ...userResolvers.Query,
    ...salonResolvers.Query,
    ...bookingResolvers.Query,
    ...reviewResolvers.Query,
  },
  Mutation: {
    ...userResolvers.Mutation,
    ...salonResolvers.Mutation,
    ...bookingResolvers.Mutation,
    ...reviewResolvers.Mutation,
  },
};
