<?php

/**
 * This script rotates the log file for the wrapper.
 *
 * It copies the current wrapper.log file to a new file with a timestamp,
 * then clears the contents of the original wrapper.log file.
 */

// Set the directory where the log files are stored
$dir = __DIR__ . '/../logs.d/';

// Get the current date and time
$date = date('Y-m-d-G-i-s');

// Copy the current wrapper.log file to a new file with a timestamp
exec("cp $dir/wrapper.log $dir/wrapper.$date.log");

// Clear the contents of the original wrapper.log file
exec("echo -n > $dir/wrapper.log");
