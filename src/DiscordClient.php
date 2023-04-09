<?php

namespace RPurinton\Modify;

require_once(__DIR__ . "/BunnyAsyncClient.php");

class DiscordClient extends ConfigLoader
{
	// Declare variables 
	private $loop = null;
	private $bunny = null;
	private $discord = null;

	// Constructor
	function __construct()
	{
		parent::__construct();
		$this->loop = \React\EventLoop\Loop::get();
		$this->config["discord"]["loop"] = $this->loop;
		$this->discord = new \Discord\Discord($this->config["discord"]);
		$this->discord->on("ready", $this->ready(...));
		$this->discord->run();
	}

	// Ready event
	private function ready()
	{
		$this->bunny = new BunnyAsyncClient($this->loop, "modify_outbox", $this->outbox(...));
		$this->discord->on("raw", $this->inbox(...));
	}

	// Send all incoming messages to the message queue (InboxHandler.php)
	private function inbox($message, $discord)
	{
		$this->bunny->publish("modify_inbox", $message);
	}

	// Route messages received from the message queue (InboxHandler.php)
	private function outbox($message)
	{
		switch ($message["function"]) {
			case "MESSAGE_DELETE":
				return $this->MESSAGE_DELETE($message);
		}
		return true;
	}

	// Delete message
	private function MESSAGE_DELETE($message)
	{
		echo ("Deleting message " . print_r($message, true));
		$this->discord->getChannel($message["channel_id"])->messages->fetch($message["id"])->then(function ($originalMessage) {
			$originalMessage->delete();
		});
		return true;
	}
}
