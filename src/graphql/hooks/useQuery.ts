import React from "react";
import { API, graphqlOperation } from "aws-amplify";
import useDeepCompareEffect from "use-deep-compare-effect";
import Observable from "zen-observable";

type UseQueryType<ResultType> = {
  loading: boolean;
  error: any;
  data: ResultType;
  refetch: () => void;
};

export const mutation = async <
  ResultType extends {},
  VariablesType extends {} = {}
>(
  query: string,
  variables?: VariablesType
) => gqlOp<ResultType, VariablesType>(query, variables);

export const gqlOp = async <
  ResultType extends {},
  VariablesType extends {} = {}
>(
  query: string,
  variables?: VariablesType
) => {
  const { data } = (await API.graphql(graphqlOperation(query, variables))) as {
    data: ResultType;
  };
  return data;
};

export const useQuery = <ResultType extends {}, VariablesType extends {} = {}>(
  query: string,
  variables?: VariablesType
): UseQueryType<ResultType> => {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [data, setData] = React.useState({} as ResultType);

  const fetchQuery = async (query: string, variables?: VariablesType) => {
    try {
      setLoading(true);
      const data = await gqlOp<ResultType, VariablesType>(query, variables)
      setData(data);
    } catch (error) {
      console.log(error);
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    fetchQuery(query, variables);
  };

  useDeepCompareEffect(() => {
    fetchQuery(query, variables);
  }, [query, variables]);

  return {
    loading,
    data,
    error,
    refetch,
  };
};

type ConfigType<VariableType extends {}> = {
  query: string;
  key: string;
  variables?: VariableType;
};

export const useSubscription = <
  ItemType extends { id: string },
  VariablesType extends {} = {}
>({
  config,
  itemData,
}: {
  config?: ConfigType<VariablesType>;
  itemData?: ItemType;
} = {}) => {
  const [item, update] = React.useState<ItemType | undefined>(itemData);

  React.useEffect(() => {
    let unsubscribe;
    if (config) {
      const { query, key, variables } = config;
      const subscription = API.graphql(graphqlOperation(query, variables));
      if (subscription instanceof Observable) {
        const sub = subscription.subscribe({
          next: payload => {
            try {
              const {
                value: {
                  data: { [key]: item },
                },
              }: {
                value: { data: { [key: string]: ItemType } };
              } = payload;

              update(item);
            } catch (error) {
              console.error(
                `${error.message} - Check the key property: the current value is ${key}`
              );
            }
          },
        });
        unsubscribe = () => {
          sub.unsubscribe();
        };
      }
    }
    return unsubscribe;
  }, [config]);

  return [item];
};