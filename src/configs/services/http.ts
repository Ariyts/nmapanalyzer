/**
 * HTTP/HTTPS Service Configuration
 * Web Server
 * 
 * @version 1.0.0
 * @author Security Team
 */
import type { ServiceConfig } from '../types';

export const httpConfig: ServiceConfig = {
  id: 'http',
  name: 'HTTP/HTTPS (Web Server)',
  description: 'HTTP/HTTPS - протокол передачи гипертекста, основа веб. Веб-серверы - одна из самых атакуемых поверхностей: уязвимые CMS, веб-приложения, API, неправильная конфигурация.',
  categoryId: 'web',
  version: '1.0.0',
  tags: ['web', 'http', 'https', 'api', 'cms'],

  matchers: {
    serviceNames: ['http', 'https', 'http-proxy', 'http-alt', 'ssl/http', 'ssl/https'],
    cpePatterns: ['cpe:/a:apache:http_server', 'cpe:/a:nginx:nginx', 'cpe:/a:microsoft:iis', 'cpe:/a:lighttpd'],
    bannerRegex: [
      'HTTP/1\\.[01]',
      'Server:\\s*Apache',
      'Server:\\s*nginx',
      'Server:\\s*Microsoft-IIS',
      'Server:\\s*lighttpd',
      'X-Powered-By:',
    ],
    productPatterns: ['Apache', 'nginx', 'Microsoft-IIS', 'lighttpd', 'Apache Tomcat', 'Jetty'],
    standardPorts: [80, 443, 8080, 8443, 8000, 8888, 3000, 5000, 9000],
    nseScriptMatchers: [
      { scriptName: 'http-title', outputPattern: '.' },
      { scriptName: 'http-server-header', outputPattern: '.' },
    ],
  },

  confidenceThreshold: 20,

  techniques: [
    {
      id: 'http-enum',
      name: 'Web Server Enumeration',
      mitreId: 'T1046',
      description: 'Сбор информации о веб-сервере: тип, версия, технологии.',
      commands: [
        { tool: 'nmap', command: 'nmap -p 80,443,8080 --script http-title,http-headers,http-server-header <target>', description: 'Basic HTTP enumeration' },
        { tool: 'whatweb', command: 'whatweb http://<target>', description: 'Web technology fingerprinting' },
        { tool: 'wappalyzer', command: 'wappalyzer http://<target>', description: 'Technology detection' },
        { tool: 'nikto', command: 'nikto -h http://<target>', description: 'Nikto web scanner' },
      ],
      nseScripts: [
        { name: 'http-title', description: 'Get page title', safe: true },
        { name: 'http-headers', description: 'Get HTTP headers', safe: true },
        { name: 'http-server-header', description: 'Server header', safe: true },
      ],
      difficulty: 'easy',
      tags: ['enumeration', 'fingerprinting'],
    },
    {
      id: 'http-directory-enum',
      name: 'Directory Enumeration',
      mitreId: 'T1083',
      description: 'Поиск скрытых директорий и файлов на веб-сервере.',
      commands: [
        { tool: 'gobuster', command: 'gobuster dir -u http://<target> -w /usr/share/wordlists/dirb/common.txt', description: 'Gobuster directory scan' },
        { tool: 'feroxbuster', command: 'feroxbuster -u http://<target> -w /usr/share/seclists/Discovery/Web-Content/common.txt', description: 'Feroxbuster scan' },
        { tool: 'dirsearch', command: 'dirsearch -u http://<target>', description: 'Dirsearch scan' },
        { tool: 'ffuf', command: 'ffuf -u http://<target>/FUZZ -w wordlist.txt', description: 'FFUF fuzzing' },
      ],
      difficulty: 'easy',
      tags: ['enumeration', 'directory', 'fuzzing'],
    },
    {
      id: 'http-vhost-enum',
      name: 'Virtual Host Enumeration',
      description: 'Поиск виртуальных хостов на веб-сервере.',
      commands: [
        { tool: 'gobuster', command: 'gobuster vhost -u http://<target> -w subdomains.txt', description: 'Vhost enumeration' },
        { tool: 'ffuf', command: 'ffuf -u http://<target> -H "Host: FUZZ.target" -w subdomains.txt', description: 'FFUF vhost fuzzing' },
      ],
      difficulty: 'medium',
      tags: ['enumeration', 'vhost', 'reconnaissance'],
    },
    {
      id: 'http-vuln-scan',
      name: 'Vulnerability Scanning',
      description: 'Сканирование на известные уязвимости веб-сервера.',
      commands: [
        { tool: 'nmap', command: 'nmap -p 80,443 --script http-vuln* <target>', description: 'NSE vulnerability scripts' },
        { tool: 'nikto', command: 'nikto -h http://<target>', description: 'Nikto vulnerability scan' },
        { tool: 'nuclei', command: 'nuclei -u http://<target> -t cves/', description: 'Nuclei CVE scan' },
      ],
      nseScripts: [
        { name: 'http-vuln-cve2006-3392', description: 'Webmin file disclosure' },
        { name: 'http-vuln-cve2017-1001000', description: 'WordPress RCE' },
      ],
      difficulty: 'medium',
      tags: ['vulnerability', 'scanning', 'cve'],
    },
    {
      id: 'http-cms-enum',
      name: 'CMS Enumeration',
      description: 'Определение и анализ CMS (WordPress, Drupal, Joomla).',
      commands: [
        { tool: 'wpscan', command: 'wpscan --url http://<target>', description: 'WordPress scan' },
        { tool: 'droopescan', command: 'droopescan scan drupal -u http://<target>', description: 'Drupal scan' },
        { tool: 'joomscan', command: 'joomscan -u http://<target>', description: 'Joomla scan' },
      ],
      difficulty: 'easy',
      tags: ['cms', 'wordpress', 'drupal', 'joomla'],
    },
    {
      id: 'http-sqli',
      name: 'SQL Injection Testing',
      mitreId: 'T1190',
      description: 'Поиск и эксплуатация SQL-инъекций.',
      commands: [
        { tool: 'sqlmap', command: 'sqlmap -u "http://target/page?id=1" --batch', description: 'SQLMap automatic test' },
        { tool: 'sqlmap', command: 'sqlmap -u "http://target/page?id=1" --dbs', description: 'Enumerate databases' },
        { tool: 'sqlmap', command: 'sqlmap -r request.txt --os-shell', description: 'Get OS shell' },
      ],
      difficulty: 'medium',
      tags: ['injection', 'sqli', 'database'],
    },
    {
      id: 'http-xss',
      name: 'XSS Testing',
      mitreId: 'T1189',
      description: 'Поиск Cross-Site Scripting уязвимостей.',
      commands: [
        { tool: 'dalfox', command: 'dalfox url http://<target>/page?param=test', description: 'Dalfox XSS scanner' },
        { tool: 'xsser', command: 'xsser -u "http://target/page?param="', description: 'XSSer scanner' },
      ],
      difficulty: 'medium',
      tags: ['xss', 'injection', 'client-side'],
    },
    {
      id: 'http-lfi-rfi',
      name: 'LFI/RFI Testing',
      mitreId: 'T1190',
      description: 'Поиск Local/Remote File Inclusion уязвимостей.',
      commands: [
        { tool: 'ffuf', command: 'ffuf -u "http://target/page?file=FUZZ" -w lfi_wordlist.txt', description: 'LFI fuzzing' },
        { tool: 'burp', command: 'Burp Suite Intruder', description: 'Manual LFI/RFI testing' },
      ],
      difficulty: 'medium',
      tags: ['lfi', 'rfi', 'file-inclusion'],
    },
  ],

  triggers: [],

  ui: {
    icon: 'globe',
    color: '#22c55e',
    displayPriority: 100,
  },

  references: [
    { title: 'Web Pentesting', url: 'https://book.hacktricks.xyz/network-services-pentesting/pentesting-web' },
    { title: 'OWASP Top 10', url: 'https://owasp.org/Top10/' },
  ],

  notes: 'HTTP - самая богатая поверхность атаки. Используйте комбинацию инструментов: nikto -> gobuster -> nuclei -> ручной анализ. Проверяйте нестандартные порты (8080, 8443, 3000, 5000, 9000).',
};

export default httpConfig;
