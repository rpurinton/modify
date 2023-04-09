<?php

declare(strict_types=1);

namespace RPurinton\Modify;

require_once(__DIR__ . "/BunnyAsyncClient.php");

/**
 * Class DiscordClient
 *
 * This class extends ConfigLoader and provides functionality for interacting with Discord.
 */
class DiscordClient extends ConfigLoader
{
	/**
	 * @var null|\React\EventLoop\LoopInterface
	 */
	private $loop = null;

	/**
	 * @var null|BunnyAsyncClient
	 */
	private $bunny = null;

	/**
	 * @var null|\Discord\Discord
	 */
	private $discord = null;

	/**
	 * DiscordClient constructor.
	 *
	 * Initializes the Discord client and sets up event listeners.
	 */
	public function __construct()
	{
		parent::__construct();
		$this->loop = \React\EventLoop\Loop::get();
		$this->config["discord"]["loop"] = $this->loop;
		$this->discord = new \Discord\Discord($this->config["discord"]);
		$this->discord->on("ready", $this->ready(...));
		$this->discord->run();
	}

	/**
	 * Ready event handler.
	 *
	 * Initializes the BunnyAsyncClient and sets up an event listener for incoming messages.
	 */
	private function ready(): void
	{
		$this->bunny = new BunnyAsyncClient($this->loop, "modify_outbox", $this->outbox(...));
		$this->discord->on("raw", $this->inbox(...));
	}

	/**
	 * Inbox event handler.
	 *
	 * Sends all incoming messages to the message queue (InboxHandler.php).
	 *
	 * @param array $message The incoming message.
	 * @param \Discord\Discord $discord The Discord client instance.
	 */
	private function inbox($message, \Discord\Discord $discord): void
	{
		$this->bunny->publish("modify_inbox", $message);
	}

	/**
	 * Outbox event handler.
	 *
	 * Routes messages received from the message queue (InboxHandler.php).
	 *
	 * @param array $message The received message.
	 *
	 * @return bool Returns true if the message was handled successfully.
	 */
	private function outbox(array $message): bool
	{
		switch ($message["function"]) {
			case "MESSAGE_DELETE":
				return $this->MESSAGE_DELETE($message);
		}
		return true;
	}

	/**
	 * Deletes a message on Discord.
	 *
	 * @param array $message The message to delete.
	 *
	 * @return bool Returns true if the message was deleted successfully.
	 */
	private function MESSAGE_DELETE(array $message): bool
	{
		echo ("Deleting message " . print_r($message, true));
		$this->discord->getChannel($message["channel_id"])->messages->fetch($message["id"])->then(function ($originalMessage) {
			$originalMessage->delete();
		});
		return true;
	}
}
