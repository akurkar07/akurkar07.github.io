PROGRAM input_greeting;

VAR
    name : STRING;
    count, i : INTEGER;

BEGIN
    READLN(name);
    READLN(count);

    FOR i := 1 TO count DO
        WRITELN('Hello, ' + name + '!');
END.
