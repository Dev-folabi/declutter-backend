export const paginated_result = (
    page: number,
    per_page: number,
    count: number,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any,
    startIndex: number = (page - 1) * per_page,
    endIndex: number = page * per_page
  ) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: any = {};
  
    result.current_page = page;
    result.per_page = per_page;
  
    if (endIndex < count) {
      result.next_page = {
        page: page + 1,
        per_page: per_page,
      };
    }
    if (startIndex > 0) {
      result.previous_page = {
        page: page - 1,
        per_page: per_page,
      };
    }
    result.has_next_page = endIndex < count ? true : false;
    result.total_result = count;
    result.data = data;
  
    return result;
  };