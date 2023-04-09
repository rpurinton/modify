<?php

declare(strict_types=1);

namespace RPurinton\Modify;

require_once(__DIR__ . "/ThreadManager.php");

/**
 * Class ProcessManager
 *
 * This class provides methods for managing processes.
 */
class ProcessManager
{
	/**
	 * ProcessManager constructor.
	 *
	 * @param string $command The command to execute.
	 */
	public function __construct(string $command = "")
	{
		if ($command === "") {
			return;
		}

		switch ($command) {
			case "status":
				return $this->status();
			case "start":
				return $this->start();
			case "restart":
				return $this->restart();
			case "stop":
				return $this->stop();
			case "kill":
				return $this->kill();
			case "wrapper":
				return $this->wrapper();
			case "main":
				return new ThreadManager;
			default:
				die("ERROR: Invalid Command\n");
		}
	}

	/**
	 * Get the process IDs of running processes.
	 *
	 * @return array The process IDs.
	 */
	private function getPids(): array
	{
		$ps = [];
		$ps2 = [];
		$ps3 = [];
		exec("ps aux | grep \"modify wrapper\"", $ps);
		exec("ps aux | grep \"modify main\"", $ps);
		foreach ($ps as $line) {
			if (!strpos($line, "grep")) {
				$ps2[] = $line;
			}
		}
		foreach ($ps2 as $line) {
			$line = $this->replace("  ", " ", $line);
			$line = explode(" ", $line);
			$ps3[] = intval($line[1]);
		}
		return $ps3;
	}

	/**
	 * Print the status of the processes.
	 */
	private function status(): void
	{
		$pids = $this->getPids();
		if (sizeof($pids) === 2) {
			echo ("modify is running... (pids " . implode(" ", $pids) . ")\n");
		} elseif (sizeof($pids)) {
			echo ("WARNING; modify is HALF running... (pids " . implode(" ", $pids) . ")\n");
		} else {
			echo ("modify is stopped.\n");
		}
	}

	/**
	 * Start the processes.
	 */
	private function start(): void
	{
		$pids = $this->getPids();
		if (sizeof($pids)) {
			die("ERROR: modify is already running.  Not starting.\n");
		}
		exec("nohup modify wrapper </dev/null >> " . __DIR__ . "/logs.d/wrapper.log 2>&1 &");
		usleep(10000);
		$this->status();
	}

	/**
	 * Stop the processes.
	 */
	private function stop(): void
	{
		$pids = $this->getPids();
		foreach ($pids as $pid) {
			posix_kill($pid, SIGTERM);
		}
		$this->status();
	}

	/**
	 * Kill the processes.
	 */
	private function kill(): void
	{
		$pids = $this->getPids();
		foreach ($pids as $pid) {
			posix_kill($pid, SIGKILL);
		}
		$this->status();
	}

	/**
	 * Restart the processes.
	 */
	private function restart(): void
	{
		$this->status();
		$this->stop();
		$this->start();
	}

	/**
	 * Wrapper for the main process.
	 */
	private function wrapper(): void
	{
		while (true) {
			passthru("modify main");
			sleep(1);
		}
	}

	private function replace(string $search, string $replace, string $subject): string
	{
		while (strpos($subject, $search) !== false) {
			$subject = str_replace($search, $replace, $subject);
		}
		return $subject;
	}
}
