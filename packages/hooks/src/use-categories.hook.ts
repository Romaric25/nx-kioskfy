import { getApiClient } from "./client";
import { useQuery } from "@tanstack/react-query";

export const useCategories = () => {
  const {
    data,
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useQuery({
    queryKey: ["categories"],
    queryFn: () => getApiClient().api.v1.categories.get(),
  });

  const categories = data?.data?.data;
  return { categories, categoriesLoading, categoriesError };
};

export const useCategory = (id: number) => {
  const {
    data,
    isLoading: categoryLoading,
    error: categoryError,
  } = useQuery({
    queryKey: ["category", id],
    queryFn: () =>
      getApiClient()
        .api.v1.categories({ id: id.toString() })
        .get(),
    enabled: !!id,
  });

  const category = data?.data?.data;
  return { category, categoryLoading, categoryError };
};

export const useCategoryBySlug = (slug: string) => {
  const {
    data,
    isLoading: categoryLoading,
    error: categoryError,
  } = useQuery({
    queryKey: ["category-slug", slug],
    queryFn: () =>
      getApiClient().api.v1.categories.slug({ slug }).get(),
    enabled: !!slug,
  });

  const category = data?.data?.data;
  return { category, categoryLoading, categoryError };
};
