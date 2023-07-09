export function parse(serializedFilter) {
  const groupingRegex = /^\((.*)\)$/;
  const decodedFilter = decodeURIComponent(serializedFilter);
  const operators = [
    '==',
    '!=',
    '<',
    '<=',
    '>',
    '>=',
    'in',
    'array-contains',
    'array-contains-any',
    'not-in',
  ];

  if (
    decodedFilter.charAt(0) !== '(' ||
    decodedFilter.charAt(decodedFilter.length - 1) !== ')'
  ) {
    throw new Error('Invalid filter');
  }

  const groupedFilters = decodedFilter
    .slice(0, decodedFilter.length - 1)
    .slice(1)
    .split(',');

  return groupedFilters.map((filter) => {
    const unwrappedFilter = filter.replace(groupingRegex, '$1');
    const operator = operators.find((operator) =>
      unwrappedFilter.includes(operator)
    );
    const [field, value] = unwrappedFilter.split(operator);

    return {
      field,
      operator,
      value,
    };
  });
}

export function reduce(filters) {
  return filters.reduce((acc, filter) => {
    acc[filter.field] = { operator: filter.operator, value: filter.value };

    return acc;
  }, {});
}
