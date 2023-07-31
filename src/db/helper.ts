/* eslint-disable @typescript-eslint/no-explicit-any */
import { Types, type PipelineStage } from 'mongoose';
import { Error } from '../debug/error';

interface Filter {
  where: string
  filters?: Filter[]
  key: string
  condition: string
  value?: string | number | string[] | number[] | boolean | boolean[]
}

interface Offset {
  page: number
  itemsPerPage: number
}

interface OffsetQuery {
  $skip: number
  $limit: number
}

interface Sort {
  sortBy: string[]
  sortDesc: boolean[] | number[]
}

interface SortQuery {
  $sort: Record<string, 1 | -1>
}

function transFilterToCondition(filter: Filter): Record<string, any> {
  const { condition, key } = filter;
  const dateRegex = /^\d{4}-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])$/;
  const dateTimeRegex = /\d{4}-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01]) (0[0-9]|1[0-9]|2[0-3]):(0[1-9]|[0-5][0-9]):(0[1-9]|[0-5][0-9])$/;
  const value = dateRegex.test(String(filter.value)) || dateTimeRegex.test(String(filter.value))
    ? new Date(String(filter.value))
    : filter.value;
  if (
    condition !== 'some' &&
    condition !== 'none' &&
    value == null &&
    filter.filters == null
  ) {
    throw Error.badRequestArgument('filters-condition');
  }
  switch (condition) {
    case 'some':
      return {
        [key]: { $ne: null },
      };
    case 'none':
      return {
        [key]: null,
      };
    case 'eq':
      if (key === '_id') {
        return {
          [key]: { [`$${String(condition)}`]: new Types.ObjectId(String(value)) },
        };
      } else {
        return {
          [key]: { [`$${String(condition)}`]: value },
        };
      }
    case 'ne':
    case 'gt':
    case 'gte':
    case 'lt':
    case 'lte':
      return {
        [key]: { [`$${String(condition)}`]: value },
      };
    case 'in':
      if (!Array.isArray(value) || value.length <= 1) {
        throw Error.badRequestArgument('filters-condition-in');
      }
      return {
        [key]: { $in: value },
      };
    case 'inc':
      return {
        [key]: { $regex: value, $options: 'i' },
      };
    case undefined:
      if (filter.filters == null) throw Error.badRequestArgument('filters-condition');
      return {};
    default:
      throw Error.badRequestArgument('filters-condition');
  }
}

function transFiltersToQuery(filters: Filter[]): Record<string, any> | null {
  if (filters.length <= 0) return null;
  const query: Record<string, Array<Record<string, any>>> = {
    or: [],
    and: [],
  };
  filters.forEach((filter: Filter) => {
    const { where } = filter;
    if (where === 'or' || where === 'and') {
      const transformedFilter = transFilterToCondition(filter);
      if (Object.keys(transformedFilter).length > 0) query[where].push(transformedFilter);
    } else {
      throw Error.badRequestArgument('filters-where');
    }
    if (filter.filters != null) {
      const subQuery = transFiltersToQuery(filter.filters);
      if (subQuery !== null) {
        query[where].push(subQuery);
      }
    }
  });
  if (query.or.length > 0 && query.and.length > 0) {
    return {
      $or: query.or,
      $and: query.and,
    };
  } else if (query.and.length > 0) {
    return {
      $and: query.and,
    };
  } else if (query.or.length > 0) {
    return {
      $or: query.or,
    };
  }
  return null;
}

function transPagenationToQuery({ page, itemsPerPage }: Offset): OffsetQuery | null {
  if (itemsPerPage <= 0 || itemsPerPage == null) return null;
  return {
    $skip: itemsPerPage * (page - 1),
    $limit: itemsPerPage,
  };
}

function transSortToQuery({ sortBy, sortDesc }: Sort): SortQuery | null {
  if (sortBy.length <= 0) return null;
  return sortBy.reduce((qurey: SortQuery, row: string, index: number) => {
    if (sortDesc[index] === 1 || sortDesc[index] === true) {
      qurey.$sort[row] = -1;
    } else {
      qurey.$sort[row] = 1;
    }
    return qurey;
  }, {
    $sort: {},
  });
}

function payloadToListQuery(preset: PipelineStage[], payload: Record<string, any>): PipelineStage[] {
  const { sortBy, sortDesc, itemsPerPage, page } = payload;

  const qurey = [
    ...preset,
  ];

  let match: Record<string, any> = {
    disable: false,
  };

  let sort: null | SortQuery = null;
  const pagenation = transPagenationToQuery({ page, itemsPerPage });

  if (payload.filters != null && Array.isArray(payload.filters)) {
    const matchQurey = transFiltersToQuery(payload.filters);
    if (matchQurey !== null) {
      match = {
        ...match,
        ...matchQurey,
      };
    }
  }
  if (sortBy != null && Array.isArray(sortBy)) sort = transSortToQuery({ sortBy, sortDesc });

  qurey.push({
    $match: match,
  });
  if (sort != null) qurey.push(sort);
  if (pagenation != null) {
    const { $skip, $limit } = pagenation;
    qurey.push({ $skip });
    qurey.push({ $limit });
  }

  return qurey;
}
function payloadToSummaryQuery(preset: PipelineStage[], payload: Record<string, any>): PipelineStage[] {
  const qurey = [
    ...preset,
  ];
  let match: Record<string, any> = {
    disable: false,
  };
  if (payload.filters != null && Array.isArray(payload.filters)) {
    const matchQurey = transFiltersToQuery(payload.filters);
    if (matchQurey !== null) {
      match = {
        ...match,
        ...matchQurey,
      };
    }
  }
  qurey.push({
    $match: match,
  });
  qurey.push({
    $count: 'total',
  });

  return qurey;
}

export {
  payloadToListQuery,
  payloadToSummaryQuery,
};
