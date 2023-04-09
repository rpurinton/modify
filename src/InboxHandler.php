<?php

namespace RPurinton\Modify;

require_once(__DIR__ . "/BunnyAsyncClient.php");

class InboxHandler extends ConfigLoader
{
	private $sql = null;
	private $bunny = null;
	function __construct()
	{
		parent::__construct();
		$loop = \React\EventLoop\Loop::get();
		$this->bunny = new BunnyAsyncClient($loop, "modify_inbox", $this->process(...));
		$loop->run();
	}

	private function process($message)
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

	private function evaluate($text)
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

	private function delete_message($message)
	{
		$message["function"] = "MESSAGE_DELETE";
		$this->bunny->publish("modify_outbox", $message);
		return true;
	}
}
