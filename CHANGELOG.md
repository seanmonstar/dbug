# dbug

## v0.4.0 - 2014-05-16
- changed dbug.enabled and dbug.colored to not look at process.env for changes
- changed `dbug.enabled` and `colored` to be setters, so you change without using process.env
- performance log functions no longer have if checks inside, they are replaced if/when `dbug.enabled` is changed.

## v0.3.0 - 2014-04-18
- fixed grey text bleeding into other input
- changed logger label from `foo.debug` to `foo:DEBUG` and colors to
  highlight level

## v0.2.0 - 2014-02-07
- changed dbug.enabled and dbug.colored to look at process.env for changes

## v0.1.0
- initial release
