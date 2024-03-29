<?php

declare(strict_types=1);

namespace RPurinton\Modify;

require_once(__DIR__ . "/ConfigLoader.php");

/**
 * Class BunnyAsyncClient
 * @package RPurinton\Modify
 */
class BunnyAsyncClient extends ConfigLoader
{
	/**
	 * @var string|null
	 */
	private $queue = null;

	/**
	 * @var \Bunny\Async\Client|null
	 */
	private $client = null;

	/**
	 * @var \Bunny\Channel|null
	 */
	private $channel = null;

	/**
	 * @var callable|null
	 */
	private $callback = null;

	/**
	 * BunnyAsyncClient constructor.
	 * @param \React\EventLoop\LoopInterface $loop
	 * @param string $queue
	 * @param callable $callback
	 */
	public function __construct($loop, string $queue, callable $callback)
	{
		parent::__construct();
		$this->queue = $queue;
		$this->callback = $callback;
		$client = new \Bunny\Async\Client($loop, $this->config["bunny"]);
		$client->connect()->then($this->getChannel(...))->then($this->consume(...));
	}

	/**
	 * @param \Bunny\Async\Client $client
	 * @return \React\Promise\PromiseInterface
	 */
	private function getChannel($client)
	{
		$this->client = $client;
		return $client->channel();
	}

	/**
	 * @param \Bunny\Channel $channel
	 */
	private function consume($channel)
	{
		$this->channel = $channel;
		$channel->qos(0, 1);
		$channel->consume($this->process(...), $this->queue);
	}

	/**
	 * Closes the channel and the client.
	 */
	private function close()
	{
		$this->channel->close();
		$this->client->disconnect();
	}

	/**
	 * @param \Bunny\Message $message
	 * @param \Bunny\Channel $channel
	 * @param \Bunny\Async\Client $client
	 */
	private function process($message, $channel, $client)
	{
		if (($this->callback)(json_decode($message->content, true))) {
			$channel->ack($message);
		} else {
			$channel->nack($message);
		}
	}

	/**
	 * @param string $queue
	 * @param array<mixed> $data
	 */
	public function publish($queue, $data)
	{
		$json_string = json_encode($data);
		$descriptorspec = array(
			0 => array("pipe", "r"),
			1 => array("pipe", "w"),
			2 => array("pipe", "w")
		);
		$queue = escapeshellarg($queue);
		$process = proc_open("/usr/bin/publish $queue", $descriptorspec, $pipes);
		if (is_resource($process)) {
			fwrite($pipes[0], $json_string);
			fclose($pipes[0]);
			fclose($pipes[1]);
			fclose($pipes[2]);
			proc_close($process);
		}
	}
}
