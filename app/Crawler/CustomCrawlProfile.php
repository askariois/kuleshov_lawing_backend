<?php

namespace App\Crawler;

use Spatie\Crawler\CrawlProfiles\CrawlProfile;
use Psr\Http\Message\UriInterface;

class CustomCrawlProfile extends CrawlProfile
{
   protected $startUrl;

   public function __construct(string $startUrl)
   {
      $this->startUrl = rtrim($startUrl, '/');
   }

   public function shouldCrawl(UriInterface $url): bool
   {
      $urlString = (string) $url;
      $host = $url->getHost();

      // 1. Только тот же домен
      if ($host !== parse_url($this->startUrl, PHP_URL_HOST)) {
         return false;
      }

      // 2. Разрешаем страницы с ?page=, &page=, /page/, /p/
      if (preg_match('/[?&]page=\d+/', $urlString)) {
         return true;
      }

      if (preg_match('#/page/\d+/#', $urlString)) {
         return true;
      }

      if (preg_match('#/p\d+/#', $urlString)) {
         return true;
      }

      // 3. Разрешаем только "обычные" страницы (без админки, wp-admin, login и т.п.)
      $path = $url->getPath();
      if (preg_match('#/(wp-admin|wp-login|admin|login|feed|xmlrpc|search)#i', $path)) {
         return false;
      }

      // 4. Ограничиваем глубину (опционально)
      $pathParts = array_filter(explode('/', $path));
      if (count($pathParts) > 5) {
         return false;
      }

      return true;
   }
}
