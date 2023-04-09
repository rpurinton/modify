<?php

namespace RPurinton\Modify;

require_once(__DIR__ . "/vendor/autoload.php");

/**
 * Class ConfigLoader
 *
 * This class loads configuration files from the conf.d directory.
 */
class ConfigLoader
{
	/**
	 * @var array|null The loaded configuration data.
	 */
	public ?array $config = null;

	/**
	 * ConfigLoader constructor.
	 *
	 * This constructor loads the configuration files from the conf.d directory and stores the data in the $config property.
	 */
	public function __construct()
	{
		exec("ls " . __DIR__ . "/conf.d/*.conf", $configfiles);
		foreach ($configfiles as $configfile) {
			$section = substr($configfile, 0, strpos($configfile, ".conf"));
			$section = substr($section, strpos($section, "conf.d/") + 7);
			$this->config[$section] = json_decode(file_get_contents($configfile), true);
		}
	}
}
