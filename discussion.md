Discussion
==========

The naive() function
--------------------

* No error checking (e.g. try-catch).
* The whole CSV file must be loaded before processing, which is inefficient and even impossible if the file is larger than available memory (not a problem with the sample).
* Line processing is handled synchronously (i.e. all processes up to sending SMS and logging to S3 has to finish before starting to process the next line), which is inefficient especially since the helper functions have considerable delay.
* "Callback hell" and monolithic structure (all in one function) makes code hard to maintain and test.

helper() function
-----------------

Both the functions return a success message __along with the error message__, which is confusing. sendingStatus and loggingStatus should contain the correct error code and message.

parse-stream
------------

Turns out that csv-parser can already handle per line parsing (at least in nodejs v4.4), so I didn't use readline. Instead I use stream-transform, also developed by csv-parser's creator, to quickly turn all the functions into pipeable streams.