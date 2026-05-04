import { UseMutationOptions } from "@tanstack/react-query";
import { queryClient } from "./queryClient";

export function createOptimisticMutation<
  TData, 
  TVariables,
  TCacheData = unknown
>(
  key: (string | number)[],
  mutationFn: (vars: TVariables) => Promise<TData>,
  updater: (oldData: TCacheData | undefined, vars: TVariables) => TCacheData
): UseMutationOptions<
  TData,
  unknown,
  TVariables,
  { previousData?: TCacheData }
> {
  return {
    mutationFn,
    onMutate: async (vars: TVariables) => {
      await queryClient.cancelQueries({ queryKey: key });

      const previousData = queryClient.getQueryData<TCacheData>(key);

      queryClient.setQueryData<TCacheData>(key, (old) => updater(old, vars));

      return { previousData };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousData) {
        queryClient.setQueryData<TCacheData>(key, context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key });
    },
  };
}
