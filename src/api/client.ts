import {ApolloClient, createHttpLink, from, InMemoryCache, makeVar, split} from "@apollo/client";
import {ACCESS_RIGHTS} from "../models/models";
import {WebSocketLink} from "@apollo/client/link/ws";
import {setContext} from "@apollo/client/link/context";
import {getMainDefinition} from "@apollo/client/utilities";
import {onError} from "@apollo/client/link/error";

const wsLink: any = new WebSocketLink({
  uri: 'wss://api.auditoriu.me/',
  options: {
    reconnect: true,
    connectionParams: () => {
      const token = localStorage.getItem('token')
      return {
        authorization: token ? `Bearer ${token}` : "",
      }
    }
  }
});

const subscriptionMiddleware = {
  applyMiddleware: (options: any, next: any) => {
    const token = localStorage.getItem('token')
    options.authorization = token ? `Bearer ${token}` : ""
    next()
  },
}

wsLink.subscriptionClient.use([subscriptionMiddleware]);

const httpLink = createHttpLink({
  uri: 'https://api.auditoriu.me/'
});

const authLink = setContext((_, {headers}) => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    }
  }
});

const splitLink = split(
  ({query}) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  httpLink,
);

const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors)
    graphQLErrors.forEach(({ message, locations, path }) =>
      alert(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`,
      ),
    );

  if (networkError) networkErrorVar(networkError);
});

export const client = new ApolloClient({
  link: from([errorLink, authLink.concat(splitLink)]),
  connectToDevTools: true,
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          isLogged: {
            read() {
              return isLoggedVar();
            },
          },
          isBlurred: {
            read() {
              return isBlurredVar();
            },
          },
          gridUpdate: {
            read() {
              return gridUpdate();
            },
          },
          accessRights: {
            read() {
              return accessRightsVar();
            },
          },
          isButtonDisabled: {
            read() {
              return isButtonDisabledVar();
            },
          },
          isPassed: {
            read() {
              return isPassedVar();
            },
          },
          networkError: {
            read() {
              return networkErrorVar();
            },
          },
        },
      },
    },
  }),
});
export const isLoggedVar = makeVar(false);
export const isBlurredVar = makeVar(false);
export const gridUpdate = makeVar(false);
export const accessRightsVar = makeVar(ACCESS_RIGHTS.USER);
export const isButtonDisabledVar = makeVar(false);
export const isPassedVar = makeVar(false);
export const networkErrorVar = makeVar(null);
