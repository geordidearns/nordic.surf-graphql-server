const express = require("express");
const { ApolloServer, gql } = require("apollo-server-express");
const { smhiAPI } = require("./datasource");
const { DateTimeResolver } = require("graphql-scalars");
const responseCachePlugin = require("apollo-server-plugin-response-cache");
const rateLimit = require("express-rate-limit");

const PORT = 4000;

const app = express();

const limiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 minute
  max: 50, // limit each IP to 100 requests per windowMs
  message:
    "Too many queries created from this IP address, please try again after an hour"
});

app.use(limiter);

const typeDefs = gql`
  scalar DateTime

  input StationInput {
    parameter: String
    stationId: String
    period: String
  }

  type ReadingValue {
    value: Float
    date: DateTime
  }

  type Reading {
    stationId: String
    stationName: String
    parameterKey: Int
    readingName: String
    readingUnit: String
    readingValues: [ReadingValue]
  }

  type Query {
    stationData(stationName: String!): [Reading]
    stationReadings(stationObjs: [StationInput]): [Reading]
  }
`;

const resolvers = {
  Query: {
    stationReadings: async (_source, { stationObjs }, { dataSources }) => {
      return dataSources.stationsAPI.getStationData(stationObjs);
    }
  },
  DateTime: DateTimeResolver
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  dataSources: () => {
    return {
      stationsAPI: new smhiAPI()
    };
  },
  plugins: [responseCachePlugin()],
  introspection: true,
  playground: true,
  engine: {
    reportSchema: true
  }
});

server.applyMiddleware({ app, path: "/graphql" });

app.listen({ port: process.env.PORT || PORT }, () => {
  console.log(
    `🌊  SMHI GraphQL API (Unofficial) is serving at http://localhost:4000${server.graphqlPath}`
  );
});
