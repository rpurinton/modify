<?php

declare(strict_types=1);

namespace RPurinton\Modify;

require_once(__DIR__ . "/ConfigLoader.php");

/**
 * Class ThreadManager
 *
 * This class extends the ConfigLoader class and manages threads for the Modify application.
 */
class ThreadManager extends ConfigLoader
{
	/**
	 * @var array|null An array of threads.
	 */
	private $threads = null;

	/**
	 * @var array|null An array of functions.
	 */
	private $functions = null;

	/**
	 * @var array|null An array of futures.
	 */
	private $futures = null;

	/**
	 * ThreadManager constructor.
	 *
	 * This constructor initializes the threads, functions, and futures arrays and starts the Discord client if specified in the configuration.
	 */
	public function __construct()
	{
		parent::__construct();

		if ($this->config["modify"]["StartDiscord"]) {
			$key = "DiscordClient";
			$this->threads[$key] = new \parallel\Runtime(__DIR__ . "/DiscordClient.php");
			$this->functions[$key] = function () {
				new DiscordClient;
			};
			$this->futures[$key] = $this->threads[$key]->run($this->functions[$key]);
		}

		for ($id = 0; $id < $this->config["modify"]["InboxHandlers"]; $id++) {
			$key = "InboxHandler$id";
			$this->threads[$key] = new \parallel\Runtime(__DIR__ . "/InboxHandler.php");
			$this->functions[$key] = function () {
				new InboxHandler;
			};
			$this->futures[$key] = $this->threads[$key]->run($this->functions[$key]);
		}

		while (true) {
			sleep(5);
			foreach ($this->futures as $key => $future) if ($future->done()) $this->futures[$key] = $this->threads[$key]->run($this->functions[$key]);
		}
	}

	/**
	 * ThreadManager destructor.
	 *
	 * This destructor kills all threads when the object is destroyed.
	 */
	public function __destruct()
	{
		foreach ($this->threads as $thread) $thread->kill();
	}
}
