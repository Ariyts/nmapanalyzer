/**
 * WinRM Service Configuration
 * Windows Remote Management
 * 
 * @version 1.0.0
 * @author Security Team
 */
import type { ServiceConfig } from '../types';

export const winrmConfig: ServiceConfig = {
  id: 'winrm',
  name: 'WinRM (Windows Remote Management)',
  description: 'WinRM - протокол удаленного управления Windows на базе WS-Management. Используется PowerShell Remoting, Ansible и другими инструментами для управления Windows-системами. Работает через HTTP (5985) или HTTPS (5986).',
  categoryId: 'remote-access',
  version: '1.0.0',
  tags: ['remote-access', 'windows', 'powershell', 'management'],

  matchers: {
    serviceNames: ['wsman', 'winrm', 'http', 'https'],
    cpePatterns: ['cpe:/a:microsoft:winrm', 'cpe:/a:microsoft:powershell'],
    bannerRegex: [
      'WinRM',
      'wsman',
      '<wsman:.*>',
      'WS-Management',
    ],
    productPatterns: ['Microsoft HTTPAPI', 'WinRM', 'Windows Remote Management'],
    standardPorts: [5985, 5986],
    nseScriptMatchers: [
      { scriptName: 'http-title', outputPattern: 'WinRM' },
    ],
  },

  confidenceThreshold: 35, // Higher because port 5985/5986 is very specific

  techniques: [
    {
      id: 'winrm-enum',
      name: 'WinRM Enumeration',
      mitreId: 'T1046',
      description: 'Определение доступности WinRM и его конфигурации на целевой системе.',
      commands: [
        { tool: 'nmap', command: 'nmap -p 5985,5986 --script http-title,http-headers <target>', description: 'WinRM port check' },
        { tool: 'crackmapexec', command: 'crackmapexec winrm <target>', description: 'CME WinRM check' },
        { tool: 'evil-winrm', command: 'evil-winrm -i <target> -u user -p pass', description: 'Test WinRM connection' },
      ],
      difficulty: 'easy',
      tags: ['enumeration', 'reconnaissance'],
    },
    {
      id: 'winrm-bruteforce',
      name: 'WinRM Brute Force',
      mitreId: 'T1110',
      description: 'Подбор учетных данных для WinRM-доступа.',
      commands: [
        { tool: 'crackmapexec', command: 'crackmapexec winrm <target> -u users.txt -p passwords.txt', description: 'CME WinRM brute force' },
        { tool: 'kerbrute', command: 'kerbrute bruteuser -d domain users.txt password', description: 'Kerberos brute force' },
      ],
      difficulty: 'easy',
      tags: ['bruteforce', 'authentication'],
    },
    {
      id: 'winrm-evil-winrm',
      name: 'Evil-WinRM Shell',
      mitreId: 'T1021.006',
      description: 'Подключение к WinRM для получения PowerShell-оболочки с расширенными возможностями.',
      commands: [
        { tool: 'evil-winrm', command: 'evil-winrm -i <target> -u user -p password', description: 'Basic connection' },
        { tool: 'evil-winrm', command: 'evil-winrm -i <target> -u user -H NTLMHASH', description: 'Pass-the-hash' },
        { tool: 'evil-winrm', command: 'evil-winrm -i <target> -c cert.pem -k key.pem', description: 'Certificate auth' },
      ],
      difficulty: 'easy',
      tags: ['shell', 'remote-access', 'post-exploitation'],
    },
    {
      id: 'winrm-powershell-remoting',
      name: 'PowerShell Remoting',
      mitreId: 'T1021.006',
      description: 'Использование встроенного PowerShell Remoting для удаленного выполнения команд.',
      commands: [
        { tool: 'powershell', command: 'Enter-PSSession -ComputerName target -Credential $cred', description: 'Interactive session' },
        { tool: 'powershell', command: 'Invoke-Command -ComputerName target -ScriptBlock { whoami }', description: 'One-off command' },
        { tool: 'powershell', command: 'Invoke-Command -ComputerName target -FilePath script.ps1', description: 'Run script remotely' },
      ],
      difficulty: 'medium',
      tags: ['execution', 'powershell', 'remote-access'],
    },
  ],

  triggers: [],

  ui: {
    icon: 'terminal-square',
    color: '#0ea5e9',
    displayPriority: 85,
  },

  references: [
    { title: 'WinRM Pentesting', url: 'https://book.hacktricks.xyz/network-services-pentesting/5985-5986-pentesting-winrm' },
    { title: 'Evil-WinRM', url: 'https://github.com/Hackplayers/evil-winrm' },
  ],

  notes: 'WinRM часто используется для Ansible и других систем автоматизации. Проверяйте как HTTP (5985) так и HTTPS (5986) порты. Evil-WinRM - лучший инструмент для работы с WinRM.',
};

export default winrmConfig;
