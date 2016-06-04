Discussion
==========

The naive() function
--------------------

* No checking whether CSV is found nor valid.
* The whole file must be loaded before processing, which is inefficient and even impossible if the file is larger than available memory.
* Line processing is handled synchronously, hampering performance.