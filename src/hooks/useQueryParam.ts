import { useSearchParams } from 'react-router-dom';
import { useCallback } from 'react';

export function useQueryParam(key: string) {
    const [searchParams, setSearchParams] = useSearchParams();
    const paramValue = searchParams.get(key);

    const setParamValue = useCallback(
        (value: string | null) => {
            setSearchParams(
                (prev) => {
                    const newParams = new URLSearchParams(prev);
                    if (value === null) {
                        newParams.delete(key);
                    } else {
                        newParams.set(key, value);
                    }
                    return newParams;
                },
                { replace: true }
            );
        },
        [key, setSearchParams]
    );

    return [paramValue, setParamValue] as const;
}
