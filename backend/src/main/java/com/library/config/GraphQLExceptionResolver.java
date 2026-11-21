package com.library.config;

import graphql.GraphQLError;
import graphql.GraphqlErrorBuilder;
import graphql.schema.DataFetchingEnvironment;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataAccessException;
import org.springframework.graphql.execution.DataFetcherExceptionResolverAdapter;
import org.springframework.graphql.execution.ErrorType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class GraphQLExceptionResolver extends DataFetcherExceptionResolverAdapter {

    @Override
    protected GraphQLError resolveToSingleError(Throwable ex, DataFetchingEnvironment env) {
        if (ex instanceof AccessDeniedException) {
            return GraphqlErrorBuilder.newError()
                    .errorType(ErrorType.FORBIDDEN)
                    .message(ex.getMessage() != null && ex.getMessage().contains("quyền")
                            ? ex.getMessage()
                            : "Bạn không có quyền truy cập tài nguyên này!")
                    .path(env.getExecutionStepInfo().getPath())
                    .location(env.getField().getSourceLocation())
                    .build();
        }
        if (ex instanceof AuthenticationException) {
            return GraphqlErrorBuilder.newError()
                    .errorType(ErrorType.UNAUTHORIZED)
                    .message("Vui lòng đăng nhập để tiếp tục!")
                    .path(env.getExecutionStepInfo().getPath())
                    .location(env.getField().getSourceLocation())
                    .build();
        }
        if (ex instanceof DataAccessException) {
            log.error("GraphQL database error at {}", env.getExecutionStepInfo().getPath(), ex);
            return GraphqlErrorBuilder.newError()
                    .errorType(ErrorType.INTERNAL_ERROR)
                    .message("Đã xảy ra lỗi hệ thống, vui lòng thử lại sau!")
                    .path(env.getExecutionStepInfo().getPath())
                    .location(env.getField().getSourceLocation())
                    .build();
        }
        if (ex instanceof IllegalArgumentException || ex instanceof RuntimeException) {
            String msg = ex.getMessage();
            if (msg != null && (msg.contains("SQL") || msg.contains("JDBC") || msg.contains("Exception"))) {
                log.warn("Sanitized runtime message at {}: {}", env.getExecutionStepInfo().getPath(), msg);
                msg = "Yêu cầu không hợp lệ hoặc dữ liệu không khả dụng!";
            }
            return GraphqlErrorBuilder.newError()
                    .errorType(ErrorType.BAD_REQUEST)
                    .message(msg != null ? msg : "Đã xảy ra lỗi khi xử lý yêu cầu")
                    .path(env.getExecutionStepInfo().getPath())
                    .location(env.getField().getSourceLocation())
                    .build();
        }
        log.error("Unexpected GraphQL error at {}", env.getExecutionStepInfo().getPath(), ex);
        return GraphqlErrorBuilder.newError()
                .errorType(ErrorType.INTERNAL_ERROR)
                .message("Đã xảy ra lỗi hệ thống, vui lòng thử lại sau!")
                .path(env.getExecutionStepInfo().getPath())
                .location(env.getField().getSourceLocation())
                .build();
    }
}
