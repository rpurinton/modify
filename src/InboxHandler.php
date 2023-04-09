<?php

declare(strict_types=1);

namespace RPurinton\Modify;

require_once(__DIR__ . "/BunnyAsyncClient.php");

/**
 * Class InboxHandler
 *
 * This class extends ConfigLoader and handles incoming messages from a queue.
 */
class InboxHandler extends ConfigLoader
{

	/**
	 * @var BunnyAsyncClient|null
	 */
	private $bunny = null;

	/**
	 * InboxHandler constructor.
	 *
	 * Initializes the BunnyAsyncClient and starts the event loop.
	 */
	public function __construct()
	{
		parent::__construct();
		$loop = \React\EventLoop\Loop::get();
		$this->bunny = new BunnyAsyncClient($loop, "modify_inbox", $this->process(...));
		$loop->run();
	}

	/**
	 * Processes incoming messages from the queue.
	 *
	 * @param array $message The incoming message from the queue.
	 * @return bool Returns true if the message was processed successfully.
	 */
	private function process(array $message): bool
	{
		switch ($message["t"]) {
			case "MESSAGE_CREATE":
			case "MESSAGE_UPDATE":
				$messaged = $message["d"];
				if (isset($messaged["content"])) {
					$results = $this->evaluate($messaged["content"]);
					if (
						is_array($results) &&
						isset($results["results"]) &&
						isset($results["results"][0]) &&
						isset($results["results"][0]["flagged"]) &&
						$results["results"][0]["flagged"]
					) {
						$message["modify_results"] = $results;
						$this->delete_message($messaged);
					}
				}
		}
		return true;
	}

	/**
	 * Evaluates the content of a message using the OpenAI API.
	 *
	 * @param string $text The content of the message to be evaluated.
	 * @return array The results of the evaluation.
	 */
	private function evaluate(string $text): array
	{
		$header[] = "Content-Type: application/json";
		$header[] = "Authorization: Bearer " . $this->config["openai"]["token"];
		$ch = curl_init();
		curl_setopt($ch, CURLOPT_POST, 1);
		curl_setopt($ch, CURLOPT_URL, 'https://api.openai.com/v1/moderations');
		curl_setopt($ch, CURLOPT_HTTPHEADER, $header);
		curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(array('input' => $text)));
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
		$result = curl_exec($ch);
		curl_close($ch);
		return json_decode($result, true);
	}

	/**
	 * Deletes a message from the queue.
	 *
	 * @param array $message The message to be deleted from the queue.
	 * @return bool Returns true if the message was deleted successfully.
	 */
	private function delete_message(array $message): bool
	{
		$message["function"] = "MESSAGE_DELETE";
		$this->bunny->publish("modify_outbox", $message);
		return true;
	}
}
