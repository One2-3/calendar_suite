"""
페이징 및 필터링 유틸리티
"""
from typing import TypeVar, Type, Optional, Tuple
from sqlalchemy.orm import Query
from sqlalchemy import desc, asc
from math import ceil

from app.schemas.common import PageRequest, PageResponse

ModelType = TypeVar("ModelType")


def apply_pagination(
    query: Query,
    page_request: PageRequest,
    default_sort: Optional[str] = None,
) -> Tuple[Query, int]:
    """
    쿼리에 페이징 및 정렬 적용
    
    Returns:
        (paginated_query, total_count)
    """
    # 정렬 처리
    if page_request.sort:
        try:
            sort_field, sort_direction = page_request.sort.split(",")
            sort_direction = sort_direction.strip().upper()
            sort_field = sort_field.strip()
            
            # 모델에서 필드 가져오기
            if hasattr(query.column_descriptions[0]["entity"], sort_field):
                field = getattr(query.column_descriptions[0]["entity"], sort_field)
                if sort_direction == "DESC":
                    query = query.order_by(desc(field))
                else:
                    query = query.order_by(asc(field))
        except (ValueError, AttributeError, IndexError):
            # 정렬 파싱 실패 시 기본 정렬 사용
            if default_sort:
                try:
                    sort_field, sort_direction = default_sort.split(",")
                    field = getattr(query.column_descriptions[0]["entity"], sort_field.strip())
                    if sort_direction.strip().upper() == "DESC":
                        query = query.order_by(desc(field))
                    else:
                        query = query.order_by(asc(field))
                except:
                    pass
    elif default_sort:
        try:
            sort_field, sort_direction = default_sort.split(",")
            field = getattr(query.column_descriptions[0]["entity"], sort_field.strip())
            if sort_direction.strip().upper() == "DESC":
                query = query.order_by(desc(field))
            else:
                query = query.order_by(asc(field))
        except:
            pass
    
    # 전체 개수 조회
    total_count = query.count()
    
    # 페이징 적용
    offset = page_request.page * page_request.size
    paginated_query = query.offset(offset).limit(page_request.size)
    
    return paginated_query, total_count


def create_page_response(
    content: list,
    page: int,
    size: int,
    total_elements: int,
    sort: Optional[str] = None,
) -> dict:
    """페이징 응답 생성"""
    total_pages = ceil(total_elements / size) if total_elements > 0 else 0
    
    return {
        "content": content,
        "page": page,
        "size": size,
        "total_elements": total_elements,
        "total_pages": total_pages,
        "sort": sort,
    }






