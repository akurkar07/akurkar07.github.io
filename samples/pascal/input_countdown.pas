PROGRAM input_countdown;

VAR
    start : INTEGER;

PROCEDURE CountDown(n : INTEGER);
BEGIN
    WRITELN(n);
    IF n > 0 THEN
        CountDown(n - 1);
END;

BEGIN
    READLN(start);
    CountDown(start);
END.
