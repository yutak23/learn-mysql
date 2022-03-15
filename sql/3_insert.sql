USE `query-cache-test`;

INSERT INTO test(SELECT test.id = NULL, test.name, test.email FROM test, test test2, test test3, test test4, test test5, test test6);