const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, 
        Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType, 
        LevelFormat, PageNumber, ShadingType, VerticalAlign, PageBreak } = require('docx');
const fs = require('fs');

// Colors - Midnight Code palette for tech/cybersecurity theme
const colors = {
  primary: '#020617',
  body: '#1E293B',
  secondary: '#64748B',
  accent: '#94A3B8',
  tableBg: '#F8FAFC',
  headerBg: '#E2E8F0',
  code: '#DC2626'
};

const tableBorder = { style: BorderStyle.SINGLE, size: 1, color: '#CBD5E1' };
const cellBorders = { top: tableBorder, bottom: tableBorder, left: tableBorder, right: tableBorder };

const doc = new Document({
  styles: {
    default: { document: { run: { font: 'Times New Roman', size: 24 } } },
    paragraphStyles: [
      { id: 'Title', name: 'Title', basedOn: 'Normal',
        run: { size: 56, bold: true, color: colors.primary, font: 'Times New Roman' },
        paragraph: { spacing: { before: 240, after: 120 }, alignment: AlignmentType.CENTER } },
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 36, bold: true, color: colors.primary, font: 'Times New Roman' },
        paragraph: { spacing: { before: 400, after: 200 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 28, bold: true, color: colors.body, font: 'Times New Roman' },
        paragraph: { spacing: { before: 300, after: 150 }, outlineLevel: 1 } },
      { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 24, bold: true, color: colors.secondary, font: 'Times New Roman' },
        paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 2 } },
    ]
  },
  numbering: {
    config: [
      { reference: 'bullet-list',
        levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: 'numbered-1',
        levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: 'numbered-2',
        levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: 'numbered-3',
        levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: 'numbered-4',
        levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: 'numbered-5',
        levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: 'numbered-6',
        levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: 'numbered-7',
        levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    ]
  },
  sections: [{
    properties: {
      page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } }
    },
    headers: {
      default: new Header({ children: [new Paragraph({ 
        alignment: AlignmentType.RIGHT,
        children: [new TextRun({ text: 'Pentest Assistant — Architecture Design', color: colors.secondary, size: 20 })]
      })] })
    },
    footers: {
      default: new Footer({ children: [new Paragraph({ 
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: '— ', color: colors.secondary }), 
                   new TextRun({ children: [PageNumber.CURRENT], color: colors.secondary }), 
                   new TextRun({ text: ' —', color: colors.secondary })]
      })] })
    },
    children: [
      // Title
      new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun('Configuration-Driven Architecture')] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 },
        children: [new TextRun({ text: 'Архитектурный дизайн для локального ассистента пентестера', color: colors.secondary, size: 24 })] }),
      
      // Page break before content
      new Paragraph({ children: [new PageBreak()] }),
      
      // Section 1: Introduction
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun('1. Введение и постановка задачи')] }),
      
      new Paragraph({ spacing: { after: 150 }, children: [
        new TextRun({ text: 'Современные инструменты для пентестинга и CTF требуют гибкости и адаптивности. Традиционный подход, при котором бизнес-логика жестко зашита в код приложения, создаёт существенные проблемы: каждый новый сервис, техника атаки или правило детектирования требует изменения исходного кода, что делает систему недоступной для кастомизации рядовыми ИБ-специалистами. Configuration-Driven Architecture решает эту проблему, вынося всю бизнес-логику во внешние конфигурационные файлы, которые могут редактироваться без участия разработчиков.' })
      ]}),
      
      new Paragraph({ spacing: { after: 150 }, children: [
        new TextRun({ text: 'Ключевое архитектурное требование данного проекта — ', bold: true }),
        new TextRun({ text: 'полное отделение базы знаний от кода приложения', bold: true, color: colors.code }),
        new TextRun({ text: '. Это означает, что любой специалист по информационной безопасности должен иметь возможность добавлять новые сервисы, техники атак, правила детектирования и рекомендации, просто редактируя JSON или TypeScript файлы, абсолютно не владея React и не меняя UI-компоненты. Приложение должно динамически рендерить интерфейс на основе этих конфигураций.', bold: true })
      ]}),
      
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('1.1. Анализ текущего состояния проекта')] }),
      
      new Paragraph({ spacing: { after: 150 }, children: [
        new TextRun({ text: 'Проект nmapanalyzer уже имеет базовую структуру для работы с Nmap-данными: парсер XML и GNMAP форматов, классификацию сервисов, детектирование Active Directory инфраструктуры и генерацию рекомендаций. Однако текущая реализация страдает от жестко закодированной бизнес-логики — все категории сервисов, правила детектирования DC, рекомендации по атакам и приоритеты находятся непосредственно в файле analyzer.ts. Это делает невозможным расширение базы знаний без изменения исходного кода.' })
      ]}),
      
      new Paragraph({ spacing: { after: 200 }, children: [
        new TextRun({ text: 'Текущий технологический стек включает React 19, TypeScript, Vite, Tailwind CSS и Zustand для управления состоянием. Это отличная основа для реализации Configuration-Driven подхода, поскольку TypeScript позволяет создавать строго типизированные конфигурации, а Zustand обеспечивает чистое разделение состояния и UI.' })
      ]}),
      
      // Section 2: Architectural Pattern
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun('2. Архитектурный паттерн: Multi-Layer Configuration Engine')] }),
      
      new Paragraph({ spacing: { after: 150 }, children: [
        new TextRun({ text: 'Предлагаемая архитектура основана на принципе ', bold: false }),
        new TextRun({ text: 'Separation of Concerns', bold: true }),
        new TextRun({ text: ' с чётким разделением на три основных слоя: слой данных (Data Layer), слой движка (Engine Layer) и слой представления (Presentation Layer). Каждый слой имеет единственную ответственность и взаимодействует с соседними слоями через строго определённые интерфейсы.' })
      ]}),
      
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('2.1. Схема слоёв архитектуры')] }),
      
      // Architecture diagram as table
      new Table({
        columnWidths: [9360],
        alignment: AlignmentType.CENTER,
        margins: { top: 100, bottom: 100, left: 180, right: 180 },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                borders: cellBorders,
                shading: { fill: '#E0F2FE', type: ShadingType.CLEAR },
                verticalAlign: VerticalAlign.CENTER,
                children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 150, after: 150 },
                  children: [new TextRun({ text: 'PRESENTATION LAYER', bold: true, size: 24 }),
                            new TextRun({ text: ' — React Components, Dynamic UI Factory', size: 20, break: 1 })] })]
              })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({
                borders: cellBorders,
                shading: { fill: '#FEF3C7', type: ShadingType.CLEAR },
                verticalAlign: VerticalAlign.CENTER,
                children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 150, after: 150 },
                  children: [new TextRun({ text: 'ENGINE LAYER', bold: true, size: 24 }),
                            new TextRun({ text: ' — Parser, Matcher, Recommendation Engine, Other Handler', size: 20, break: 1 })] })]
              })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({
                borders: cellBorders,
                shading: { fill: '#D1FAE5', type: ShadingType.CLEAR },
                verticalAlign: VerticalAlign.CENTER,
                children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 150, after: 150 },
                  children: [new TextRun({ text: 'DATA LAYER', bold: true, size: 24 }),
                            new TextRun({ text: ' — JSON/TS Configs, IndexedDB Storage, Nmap Files', size: 20, break: 1 })] })]
              })
            ]
          })
        ]
      }),
      
      new Paragraph({ spacing: { before: 200, after: 200 }, alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: 'Рисунок 1. Трёхуровневая архитектура системы', italics: true, size: 20, color: colors.secondary })] }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('2.2. Data Layer — Слой конфигураций')] }),
      
      new Paragraph({ spacing: { after: 150 }, children: [
        new TextRun({ text: 'Data Layer является фундаментом системы и содержит всю базу знаний приложения. Этот слой полностью декларативен и состоит из TypeScript/JSON конфигурационных файлов. Ключевое преимущество использования TypeScript для конфигов — статическая типизация и автодополнение в IDE, что существенно снижает порог входа для ИБ-специалистов. Конфигурации делятся на несколько категорий:' })
      ]}),
      
      new Paragraph({ numbering: { reference: 'numbered-1', level: 0 }, children: [
        new TextRun({ text: 'Service Configs', bold: true }),
        new TextRun(' — определения сервисов: порты, regex-паттерны для детектирования версий, рекомендации по атакам')
      ]}),
      new Paragraph({ numbering: { reference: 'numbered-1', level: 0 }, children: [
        new TextRun({ text: 'Vulnerability Configs', bold: true }),
        new TextRun(' — маппинг CVE, NSE-скриптов и эксплойтов')
      ]}),
      new Paragraph({ numbering: { reference: 'numbered-1', level: 0 }, children: [
        new TextRun({ text: 'Attack Technique Configs', bold: true }),
        new TextRun(' — чек-листы атак, инструменты, команды')
      ]}),
      new Paragraph({ numbering: { reference: 'numbered-1', level: 0 }, children: [
        new TextRun({ text: 'Infrastructure Rules', bold: true }),
        new TextRun(' — правила детектирования AD, DNS-зон, сетевой инфраструктуры')
      ]}),
      new Paragraph({ numbering: { reference: 'numbered-1', level: 0 }, spacing: { after: 200 }, children: [
        new TextRun({ text: 'UI Rendering Configs', bold: true }),
        new TextRun(' — шаблоны отображения, иконки, цветовые схемы')
      ]}),
      
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('2.3. Engine Layer — Движок обработки')] }),
      
      new Paragraph({ spacing: { after: 150 }, children: [
        new TextRun({ text: 'Engine Layer представляет собой набор stateless-функций, которые преобразуют сырые данные Nmap в структурированную информацию, используя конфигурации из Data Layer. Этот слой не содержит бизнес-логики как таковой — он является исполнительным механизмом, который применяет правила из конфигов к входным данным. Основные компоненты движка:' })
      ]}),
      
      new Paragraph({ numbering: { reference: 'bullet-list', level: 0 }, children: [
        new TextRun({ text: 'NmapParser', bold: true }),
        new TextRun(' — парсинг XML/GNMAP в унифицированный формат ParsedScan')
      ]}),
      new Paragraph({ numbering: { reference: 'bullet-list', level: 0 }, children: [
        new TextRun({ text: 'ServiceMatcher', bold: true }),
        new TextRun(' — сопоставление сервисов с конфигами по портам, версиям, regex')
      ]}),
      new Paragraph({ numbering: { reference: 'bullet-list', level: 0 }, children: [
        new TextRun({ text: 'VulnerabilityMapper', bold: true }),
        new TextRun(' — маппинг CVE и NSE-скриптов на техники атак')
      ]}),
      new Paragraph({ numbering: { reference: 'bullet-list', level: 0 }, children: [
        new TextRun({ text: 'RecommendationEngine', bold: true }),
        new TextRun(' — генерация рекомендаций на основе матчинга')
      ]}),
      new Paragraph({ numbering: { reference: 'bullet-list', level: 0 }, spacing: { after: 200 }, children: [
        new TextRun({ text: 'OtherHandler', bold: true }),
        new TextRun(' — перехват и логирование неизвестных сервисов')
      ]}),
      
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('2.4. Presentation Layer — Слой представления')] }),
      
      new Paragraph({ spacing: { after: 150 }, children: [
        new TextRun({ text: 'Presentation Layer отвечает исключительно за визуализацию данных, полученных от Engine Layer. Ключевой принцип — компоненты не знают о бизнес-логике и не принимают решений о том, что отображать. Все решения принимаются на уровне конфигов и движка, а компоненты лишь рендерят переданные им данные. Это достигается через паттерн Component Factory, который динамически создаёт UI-компоненты на основе типа данных и конфигурации отображения.' })
      ]}),
      
      new Paragraph({ spacing: { after: 200 }, children: [
        new TextRun({ text: 'Важно отметить, что Presentation Layer включает в себя не только React-компоненты, но и Zustand-стор для управления состоянием приложения. Стор хранит результаты работы движка, но не содержит логики их получения — вся логика инкапсулирована в Engine Layer. Это обеспечивает чистоту архитектуры и возможность легкого тестирования каждого слоя независимо.' })
      ]}),
      
      // Section 3: Data Model
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun('3. Схема данных (Data Model)')] }),
      
      new Paragraph({ spacing: { after: 150 }, children: [
        new TextRun({ text: 'Схема данных является ядром Configuration-Driven архитектуры. Правильно спроектированные TypeScript-интерфейсы обеспечивают типобезопасность, автодополнение в IDE и самодокументируемость конфигураций. Ниже представлены ключевые интерфейсы с подробными комментариями по каждому полю.' })
      ]}),
      
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('3.1. Базовые типы')] }),
      
      new Paragraph({ spacing: { after: 100 }, children: [
        new TextRun({ text: 'Базовые типы определяют общие конструкции, используемые во всей системе. Они включают типы для приоритетов, категорий, условий триггеров и результатов матчинга.', size: 22 })
      ]}),
      
      // Code block for base types
      new Table({
        columnWidths: [9360],
        alignment: AlignmentType.CENTER,
        margins: { top: 50, bottom: 50, left: 100, right: 100 },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                borders: cellBorders,
                shading: { fill: '#1E293B', type: ShadingType.CLEAR },
                children: [
                  new Paragraph({ spacing: { before: 100 }, children: [new TextRun({ text: '// core/types.ts', color: '#94A3B8', font: 'Consolas', size: 18 })] }),
                  new Paragraph({ children: [new TextRun({ text: 'export type Priority = \'CRITICAL\' | \'HIGH\' | \'MEDIUM\' | \'LOW\' | \'INFO\';', color: '#E2E8F0', font: 'Consolas', size: 18 })] }),
                  new Paragraph({ children: [new TextRun({ text: 'export type Protocol = \'tcp\' | \'udp\';', color: '#E2E8F0', font: 'Consolas', size: 18 })] }),
                  new Paragraph({ children: [new TextRun({ text: 'export type PortState = \'open\' | \'filtered\' | \'closed\';', color: '#E2E8F0', font: 'Consolas', size: 18 })] }),
                  new Paragraph({ children: [new TextRun({ text: '', color: '#E2E8F0', font: 'Consolas', size: 18 })] }),
                  new Paragraph({ children: [new TextRun({ text: 'export interface TriggerCondition {', color: '#E2E8F0', font: 'Consolas', size: 18 })] }),
                  new Paragraph({ children: [new TextRun({ text: '  ports?: number[];           // Список портов', color: '#A5B4FC', font: 'Consolas', size: 18 })] }),
                  new Paragraph({ children: [new TextRun({ text: '  services?: string[];        // Nmap service names', color: '#A5B4FC', font: 'Consolas', size: 18 })] }),
                  new Paragraph({ children: [new TextRun({ text: '  products?: string[];        // Product names (nginx, Apache)', color: '#A5B4FC', font: 'Consolas', size: 18 })] }),
                  new Paragraph({ children: [new TextRun({ text: '  versionRegex?: string;      // Regex для версии', color: '#A5B4FC', font: 'Consolas', size: 18 })] }),
                  new Paragraph({ children: [new TextRun({ text: '  nseScripts?: string[];      // Требуемые NSE скрипты', color: '#A5B4FC', font: 'Consolas', size: 18 })] }),
                  new Paragraph({ children: [new TextRun({ text: '  cvePatterns?: string[];     // CVE паттерны (CVE-2019-*)', color: '#A5B4FC', font: 'Consolas', size: 18 })] }),
                  new Paragraph({ children: [new TextRun({ text: '  bannerPatterns?: string[];  // Паттерны в баннере', color: '#A5B4FC', font: 'Consolas', size: 18 })] }),
                  new Paragraph({ children: [new TextRun({ text: '  osMatch?: string;           // Совпадение по ОС', color: '#A5B4FC', font: 'Consolas', size: 18 })] }),
                  new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: '}', color: '#E2E8F0', font: 'Consolas', size: 18 })] }),
                ]
              })
            ]
          })
        ]
      }),
      
      new Paragraph({ spacing: { before: 200, after: 200 }, alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: 'Листинг 1. Базовые типы для системы конфигураций', italics: true, size: 20, color: colors.secondary })] }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('3.2. Конфигурация сервиса (ServiceConfig)')] }),
      
      new Paragraph({ spacing: { after: 150 }, children: [
        new TextRun({ text: 'ServiceConfig является основным типом конфигурации. Он описывает всё, что система должна знать о сервисе: как его детектировать, какую опасность он представляет, какие техники атак применимы, и как визуализировать информацию о нём. Структура спроектирована так, чтобы ИБ-специалист мог добавить новый сервис, просто создав новый файл с экспортом объекта ServiceConfig.' })
      ]}),
      
      new Table({
        columnWidths: [9360],
        alignment: AlignmentType.CENTER,
        margins: { top: 50, bottom: 50, left: 100, right: 100 },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                borders: cellBorders,
                shading: { fill: '#1E293B', type: ShadingType.CLEAR },
                children: [
                  new Paragraph({ spacing: { before: 100 }, children: [new TextRun({ text: '// configs/services/types.ts', color: '#94A3B8', font: 'Consolas', size: 18 })] }),
                  new Paragraph({ children: [new TextRun({ text: 'export interface ServiceConfig {', color: '#E2E8F0', font: 'Consolas', size: 18 })] }),
                  new Paragraph({ children: [new TextRun({ text: '  id: string;                    // Уникальный ID: "smb", "http"', color: '#A5B4FC', font: 'Consolas', size: 18 })] }),
                  new Paragraph({ children: [new TextRun({ text: '  name: string;                  // Человекочитаемое название', color: '#A5B4FC', font: 'Consolas', size: 18 })] }),
                  new Paragraph({ children: [new TextRun({ text: '  category: string;              // Категория: "remote_access"', color: '#A5B4FC', font: 'Consolas', size: 18 })] }),
                  new Paragraph({ children: [new TextRun({ text: '  description: string;           // Описание сервиса', color: '#A5B4FC', font: 'Consolas', size: 18 })] }),
                  new Paragraph({ children: [new TextRun({ text: '  triggers: TriggerCondition[];  // Условия детектирования', color: '#A5B4FC', font: 'Consolas', size: 18 })] }),
                  new Paragraph({ children: [new TextRun({ text: '  defaultPriority: Priority;     // Дефолтный приоритет', color: '#A5B4FC', font: 'Consolas', size: 18 })] }),
                  new Paragraph({ children: [new TextRun({ text: '  riskScore: number;             // 1-10, влияет на приоритеты', color: '#A5B4FC', font: 'Consolas', size: 18 })] }),
                  new Paragraph({ children: [new TextRun({ text: '  techniques: AttackTechnique[]; // Техники атак', color: '#A5B4FC', font: 'Consolas', size: 18 })] }),
                  new Paragraph({ children: [new TextRun({ text: '  references: Reference[];       // Ссылки на CVE, эксплойты', color: '#A5B4FC', font: 'Consolas', size: 18 })] }),
                  new Paragraph({ children: [new TextRun({ text: '  uiConfig: UIConfig;            // Настройки отображения', color: '#A5B4FC', font: 'Consolas', size: 18 })] }),
                  new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: '}', color: '#E2E8F0', font: 'Consolas', size: 18 })] }),
                ]
              })
            ]
          })
        ]
      }),
      
      new Paragraph({ spacing: { before: 200, after: 200 }, alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: 'Листинг 2. Интерфейс ServiceConfig', italics: true, size: 20, color: colors.secondary })] }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('3.3. Пример конфигурации для SMB')] }),
      
      new Paragraph({ spacing: { after: 150 }, children: [
        new TextRun({ text: 'Ниже представлен полный пример конфигурации для SMB-сервиса. Этот конфиг демонстрирует все возможности системы: множественные триггеры для детектирования, богатый набор техник атак с шаблонами команд, CVE-референсы и настройки UI. Обратите внимание на использование плейсхолдеров {ip}, {domain}, {user} — движок автоматически подставляет реальные значения при генерации команд.' })
      ]}),
      
      new Table({
        columnWidths: [9360],
        alignment: AlignmentType.CENTER,
        margins: { top: 50, bottom: 50, left: 100, right: 100 },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                borders: cellBorders,
                shading: { fill: '#1E293B', type: ShadingType.CLEAR },
                children: [
                  new Paragraph({ spacing: { before: 100 }, children: [new TextRun({ text: '// configs/services/smb.ts', color: '#94A3B8', font: 'Consolas', size: 16 })] }),
                  new Paragraph({ children: [new TextRun({ text: 'import { ServiceConfig } from \'./types\';', color: '#E2E8F0', font: 'Consolas', size: 16 })] }),
                  new Paragraph({ children: [new TextRun({ text: '', color: '#E2E8F0', font: 'Consolas', size: 16 })] }),
                  new Paragraph({ children: [new TextRun({ text: 'export const smbConfig: ServiceConfig = {', color: '#E2E8F0', font: 'Consolas', size: 16 })] }),
                  new Paragraph({ children: [new TextRun({ text: '  id: \'smb\',', color: '#E2E8F0', font: 'Consolas', size: 16 })] }),
                  new Paragraph({ children: [new TextRun({ text: '  name: \'SMB / Windows Sharing\',', color: '#E2E8F0', font: 'Consolas', size: 16 })] }),
                  new Paragraph({ children: [new TextRun({ text: '  category: \'file_sharing\',', color: '#E2E8F0', font: 'Consolas', size: 16 })] }),
                  new Paragraph({ children: [new TextRun({ text: '  description: \'Server Message Block protocol for file/printer sharing.\'', color: '#E2E8F0', font: 'Consolas', size: 16 })] }),
                  new Paragraph({ children: [new TextRun({ text: '', color: '#E2E8F0', font: 'Consolas', size: 16 })] }),
                  new Paragraph({ children: [new TextRun({ text: '  triggers: [', color: '#E2E8F0', font: 'Consolas', size: 16 })] }),
                  new Paragraph({ children: [new TextRun({ text: '    { ports: [445, 139], services: [\'microsoft-ds\', \'netbios-ssn\'] },', color: '#E2E8F0', font: 'Consolas', size: 16 })] }),
                  new Paragraph({ children: [new TextRun({ text: '    { bannerPatterns: [\'SMB\', \'Windows NT\'] }', color: '#E2E8F0', font: 'Consolas', size: 16 })] }),
                  new Paragraph({ children: [new TextRun({ text: '  ],', color: '#E2E8F0', font: 'Consolas', size: 16 })] }),
                  new Paragraph({ children: [new TextRun({ text: '', color: '#E2E8F0', font: 'Consolas', size: 16 })] }),
                  new Paragraph({ children: [new TextRun({ text: '  defaultPriority: \'HIGH\',', color: '#E2E8F0', font: 'Consolas', size: 16 })] }),
                  new Paragraph({ children: [new TextRun({ text: '  riskScore: 8,', color: '#E2E8F0', font: 'Consolas', size: 16 })] }),
                  new Paragraph({ children: [new TextRun({ text: '', color: '#E2E8F0', font: 'Consolas', size: 16 })] }),
                  new Paragraph({ children: [new TextRun({ text: '  techniques: [', color: '#E2E8F0', font: 'Consolas', size: 16 })] }),
                  new Paragraph({ children: [new TextRun({ text: '    {', color: '#E2E8F0', font: 'Consolas', size: 16 })] }),
                  new Paragraph({ children: [new TextRun({ text: '      id: \'smb-enum\',', color: '#E2E8F0', font: 'Consolas', size: 16 })] }),
                  new Paragraph({ children: [new TextRun({ text: '      name: \'SMB Enumeration\',', color: '#E2E8F0', font: 'Consolas', size: 16 })] }),
                  new Paragraph({ children: [new TextRun({ text: '      description: \'Enumerate shares, users, sessions\',', color: '#E2E8F0', font: 'Consolas', size: 16 })] }),
                  new Paragraph({ children: [new TextRun({ text: '      tools: [\'crackmapexec\', \'enum4linux-ng\', \'smbclient\'],', color: '#E2E8F0', font: 'Consolas', size: 16 })] }),
                  new Paragraph({ children: [new TextRun({ text: '      commands: [', color: '#E2E8F0', font: 'Consolas', size: 16 })] }),
                  new Paragraph({ children: [new TextRun({ text: '        \'crackmapexec smb {ip} --shares\',', color: '#E2E8F0', font: 'Consolas', size: 16 })] }),
                  new Paragraph({ children: [new TextRun({ text: '        \'crackmapexec smb {ip} --users\',', color: '#E2E8F0', font: 'Consolas', size: 16 })] }),
                  new Paragraph({ children: [new TextRun({ text: '        \'enum4linux-ng -A {ip}\',', color: '#E2E8F0', font: 'Consolas', size: 16 })] }),
                  new Paragraph({ children: [new TextRun({ text: '        \'smbclient -L //{ip} -N\'', color: '#E2E8F0', font: 'Consolas', size: 16 })] }),
                  new Paragraph({ children: [new TextRun({ text: '      ],', color: '#E2E8F0', font: 'Consolas', size: 16 })] }),
                  new Paragraph({ children: [new TextRun({ text: '      priority: \'MEDIUM\'', color: '#E2E8F0', font: 'Consolas', size: 16 })] }),
                  new Paragraph({ children: [new TextRun({ text: '    },', color: '#E2E8F0', font: 'Consolas', size: 16 })] }),
                  new Paragraph({ children: [new TextRun({ text: '    {', color: '#E2E8F0', font: 'Consolas', size: 16 })] }),
                  new Paragraph({ children: [new TextRun({ text: '      id: \'smb-vuln-ms17-010\',', color: '#E2E8F0', font: 'Consolas', size: 16 })] }),
                  new Paragraph({ children: [new TextRun({ text: '      name: \'EternalBlue (MS17-010)\',', color: '#E2E8F0', font: 'Consolas', size: 16 })] }),
                  new Paragraph({ children: [new TextRun({ text: '      description: \'RCE via SMBv1 vulnerability\',', color: '#E2E8F0', font: 'Consolas', size: 16 })] }),
                  new Paragraph({ children: [new TextRun({ text: '      trigger: { nseScripts: [\'smb-vuln-ms17-010\'] },', color: '#E2E8F0', font: 'Consolas', size: 16 })] }),
                  new Paragraph({ children: [new TextRun({ text: '      commands: [', color: '#E2E8F0', font: 'Consolas', size: 16 })] }),
                  new Paragraph({ children: [new TextRun({ text: '        \'nmap --script smb-vuln-ms17-010 -p445 {ip}\',', color: '#E2E8F0', font: 'Consolas', size: 16 })] }),
                  new Paragraph({ children: [new TextRun({ text: '        \'use exploit/windows/smb/ms17_010_eternalblue\'', color: '#E2E8F0', font: 'Consolas', size: 16 })] }),
                  new Paragraph({ children: [new TextRun({ text: '      ],', color: '#E2E8F0', font: 'Consolas', size: 16 })] }),
                  new Paragraph({ children: [new TextRun({ text: '      priority: \'CRITICAL\'', color: '#E2E8F0', font: 'Consolas', size: 16 })] }),
                  new Paragraph({ children: [new TextRun({ text: '    }', color: '#E2E8F0', font: 'Consolas', size: 16 })] }),
                  new Paragraph({ children: [new TextRun({ text: '  ],', color: '#E2E8F0', font: 'Consolas', size: 16 })] }),
                  new Paragraph({ children: [new TextRun({ text: '', color: '#E2E8F0', font: 'Consolas', size: 16 })] }),
                  new Paragraph({ children: [new TextRun({ text: '  uiConfig: {', color: '#E2E8F0', font: 'Consolas', size: 16 })] }),
                  new Paragraph({ children: [new TextRun({ text: '    icon: \'folder-network\',', color: '#E2E8F0', font: 'Consolas', size: 16 })] }),
                  new Paragraph({ children: [new TextRun({ text: '    color: \'#f59e0b\',', color: '#E2E8F0', font: 'Consolas', size: 16 })] }),
                  new Paragraph({ children: [new TextRun({ text: '    tags: [\'SMB\', \'Windows\', \'File Sharing\']', color: '#E2E8F0', font: 'Consolas', size: 16 })] }),
                  new Paragraph({ children: [new TextRun({ text: '  }', color: '#E2E8F0', font: 'Consolas', size: 16 })] }),
                  new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: '};', color: '#E2E8F0', font: 'Consolas', size: 16 })] }),
                ]
              })
            ]
          })
        ]
      }),
      
      new Paragraph({ spacing: { before: 200, after: 200 }, alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: 'Листинг 3. Полная конфигурация для SMB-сервиса', italics: true, size: 20, color: colors.secondary })] }),
      
      // Section 4: Dynamic UI
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun('4. Динамический UI: Component Factory Pattern')] }),
      
      new Paragraph({ spacing: { after: 150 }, children: [
        new TextRun({ text: 'Динамический рендеринг UI на основе конфигураций — ключевой элемент архитектуры. Идея заключается в том, что React-компоненты не содержат логики принятия решений о том, что отображать. Вместо этого используется паттерн Component Factory, который на основе типа данных и конфигурации создаёт соответствующие компоненты.' })
      ]}),
      
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('4.1. Архитектура Component Factory')] }),
      
      new Paragraph({ spacing: { after: 150 }, children: [
        new TextRun({ text: 'Component Factory — это центральный модуль, который регистрирует компоненты для различных типов данных и динамически создаёт их при рендеринге. Фабрика принимает на вход данные и конфигурацию UI, а возвращает готовый React-элемент. Это позволяет добавлять новые типы отображения без изменения существующих компонентов — достаточно зарегистрировать новый компонент в фабрике.' })
      ]}),
      
      new Table({
        columnWidths: [9360],
        alignment: AlignmentType.CENTER,
        margins: { top: 50, bottom: 50, left: 100, right: 100 },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                borders: cellBorders,
                shading: { fill: '#1E293B', type: ShadingType.CLEAR },
                children: [
                  new Paragraph({ spacing: { before: 100 }, children: [new TextRun({ text: '// ui/factory/ComponentFactory.tsx', color: '#94A3B8', font: 'Consolas', size: 16 })] }),
                  new Paragraph({ children: [new TextRun({ text: 'type ComponentType = \'service-card\' | \'technique-list\' | \'cve-badge\' | \'command-block\';', color: '#E2E8F0', font: 'Consolas', size: 16 })] }),
                  new Paragraph({ children: [new TextRun({ text: '', color: '#E2E8F0', font: 'Consolas', size: 16 })] }),
                  new Paragraph({ children: [new TextRun({ text: 'const componentRegistry = new Map<ComponentType, React.FC<any>>();', color: '#E2E8F0', font: 'Consolas', size: 16 })] }),
                  new Paragraph({ children: [new TextRun({ text: '', color: '#E2E8F0', font: 'Consolas', size: 16 })] }),
                  new Paragraph({ children: [new TextRun({ text: 'export function registerComponent(type: ComponentType, component: React.FC) {', color: '#E2E8F0', font: 'Consolas', size: 16 })] }),
                  new Paragraph({ children: [new TextRun({ text: '  componentRegistry.set(type, component);', color: '#E2E8F0', font: 'Consolas', size: 16 })] }),
                  new Paragraph({ children: [new TextRun({ text: '}', color: '#E2E8F0', font: 'Consolas', size: 16 })] }),
                  new Paragraph({ children: [new TextRun({ text: '', color: '#E2E8F0', font: 'Consolas', size: 16 })] }),
                  new Paragraph({ children: [new TextRun({ text: 'export function createComponent(type: ComponentType, props: any) {', color: '#E2E8F0', font: 'Consolas', size: 16 })] }),
                  new Paragraph({ children: [new TextRun({ text: '  const Component = componentRegistry.get(type);', color: '#E2E8F0', font: 'Consolas', size: 16 })] }),
                  new Paragraph({ children: [new TextRun({ text: '  if (!Component) return null;', color: '#E2E8F0', font: 'Consolas', size: 16 })] }),
                  new Paragraph({ children: [new TextRun({ text: '  return <Component {...props} />;', color: '#E2E8F0', font: 'Consolas', size: 16 })] }),
                  new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: '}', color: '#E2E8F0', font: 'Consolas', size: 16 })] }),
                ]
              })
            ]
          })
        ]
      }),
      
      new Paragraph({ spacing: { before: 200, after: 200 }, alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: 'Листинг 4. Базовая реализация Component Factory', italics: true, size: 20, color: colors.secondary })] }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('4.2. Конфигурируемый рендеринг рекомендаций')] }),
      
      new Paragraph({ spacing: { after: 150 }, children: [
        new TextRun({ text: 'Рекомендации — ключевой элемент UI пентест-ассистента. Они должны отображаться динамически на основе конфигураций и поддерживать различные форматы: списки команд, ссылки на инструменты, CWE/CVE референсы. Конфигурация рендеринга позволяет определить, как именно будет выглядеть каждая рекомендация без изменения React-компонентов.' })
      ]}),
      
      new Table({
        columnWidths: [9360],
        alignment: AlignmentType.CENTER,
        margins: { top: 50, bottom: 50, left: 100, right: 100 },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                borders: cellBorders,
                shading: { fill: '#1E293B', type: ShadingType.CLEAR },
                children: [
                  new Paragraph({ spacing: { before: 100 }, children: [new TextRun({ text: '// configs/ui/recommendation-ui.ts', color: '#94A3B8', font: 'Consolas', size: 16 })] }),
                  new Paragraph({ children: [new TextRun({ text: 'export const recommendationUIConfig = {', color: '#E2E8F0', font: 'Consolas', size: 16 })] }),
                  new Paragraph({ children: [new TextRun({ text: '  layout: \'accordion\',          // accordion | cards | list', color: '#A5B4FC', font: 'Consolas', size: 16 })] }),
                  new Paragraph({ children: [new TextRun({ text: '  groupBy: \'category\',          // category | priority | host', color: '#A5B4FC', font: 'Consolas', size: 16 })] }),
                  new Paragraph({ children: [new TextRun({ text: '  sortPriorities: [\'CRITICAL\', \'HIGH\', \'MEDIUM\', \'LOW\'],', color: '#A5B4FC', font: 'Consolas', size: 16 })] }),
                  new Paragraph({ children: [new TextRun({ text: '  showCounts: true,', color: '#A5B4FC', font: 'Consolas', size: 16 })] }),
                  new Paragraph({ children: [new TextRun({ text: '  commandFormat: \'copyable\',   // copyable | terminal | markdown', color: '#A5B4FC', font: 'Consolas', size: 16 })] }),
                  new Paragraph({ children: [new TextRun({ text: '  priorityColors: {', color: '#A5B4FC', font: 'Consolas', size: 16 })] }),
                  new Paragraph({ children: [new TextRun({ text: '    CRITICAL: { bg: \'#fef2f2\', text: \'#dc2626\', icon: \'alert-octagon\' },', color: '#E2E8F0', font: 'Consolas', size: 16 })] }),
                  new Paragraph({ children: [new TextRun({ text: '    HIGH:     { bg: \'#fff7ed\', text: \'#ea580c\', icon: \'alert-triangle\' },', color: '#E2E8F0', font: 'Consolas', size: 16 })] }),
                  new Paragraph({ children: [new TextRun({ text: '    MEDIUM:   { bg: \'#fefce8\', text: \'#ca8a04\', icon: \'alert-circle\' },', color: '#E2E8F0', font: 'Consolas', size: 16 })] }),
                  new Paragraph({ children: [new TextRun({ text: '    LOW:      { bg: \'#f0fdf4\', text: \'#16a34a\', icon: \'info\' }', color: '#E2E8F0', font: 'Consolas', size: 16 })] }),
                  new Paragraph({ children: [new TextRun({ text: '  }', color: '#A5B4FC', font: 'Consolas', size: 16 })] }),
                  new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: '};', color: '#E2E8F0', font: 'Consolas', size: 16 })] }),
                ]
              })
            ]
          })
        ]
      }),
      
      new Paragraph({ spacing: { before: 200, after: 200 }, alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: 'Листинг 5. Конфигурация UI для рекомендаций', italics: true, size: 20, color: colors.secondary })] }),
      
      // Section 5: Mapping and Other
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun('5. Алгоритм маппинга и обработка "Other"')] }),
      
      new Paragraph({ spacing: { after: 150 }, children: [
        new TextRun({ text: 'Одной из ключевых особенностей системы является интеллектуальная обработка неизвестных сервисов. Когда Nmap находит сервис, для которого нет конфигурации, система не должна просто игнорировать его. Вместо этого неизвестные сервисы попадают в специальную категорию "Other", где они логируются с полным контекстом для последующего анализа и создания новых конфигураций.' })
      ]}),
      
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('5.1. Алгоритм ServiceMatcher')] }),
      
      new Paragraph({ spacing: { after: 150 }, children: [
        new TextRun({ text: 'ServiceMatcher — это ядро системы матчинга. Он принимает распарсенные данные Nmap и конфигурации сервисов, а возвращает список MatchedService объектов, каждый из которых содержит информацию о сервисе, уровень уверенности в матче и применимые техники атак. Алгоритм работает в несколько этапов:' })
      ]}),
      
      new Paragraph({ numbering: { reference: 'numbered-2', level: 0 }, children: [
        new TextRun({ text: 'Прямой матчинг по портам', bold: true }),
        new TextRun(' — проверка совпадения номера порта с определёнными в конфиге')
      ]}),
      new Paragraph({ numbering: { reference: 'numbered-2', level: 0 }, children: [
        new TextRun({ text: 'Матчинг по имени сервиса', bold: true }),
        new TextRun(' — сравнение с Nmap service name (http, ssh, mysql)')
      ]}),
      new Paragraph({ numbering: { reference: 'numbered-2', level: 0 }, children: [
        new TextRun({ text: 'Regex-матчинг версии', bold: true }),
        new TextRun(' — применение регулярных выражений к product/version')
      ]}),
      new Paragraph({ numbering: { reference: 'numbered-2', level: 0 }, children: [
        new TextRun({ text: 'NSE-скрипт матчинг', bold: true }),
        new TextRun(' — проверка наличия определённых NSE скриптов')
      ]}),
      new Paragraph({ numbering: { reference: 'numbered-2', level: 0 }, spacing: { after: 200 }, children: [
        new TextRun({ text: 'Fallback в "Other"', bold: true }),
        new TextRun(' — если ни один матч не найден')
      ]}),
      
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('5.2. Реализация OtherHandler')] }),
      
      new Table({
        columnWidths: [9360],
        alignment: AlignmentType.CENTER,
        margins: { top: 50, bottom: 50, left: 100, right: 100 },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                borders: cellBorders,
                shading: { fill: '#1E293B', type: ShadingType.CLEAR },
                children: [
                  new Paragraph({ spacing: { before: 100 }, children: [new TextRun({ text: '// engine/OtherHandler.ts', color: '#94A3B8', font: 'Consolas', size: 16 })] }),
                  new Paragraph({ children: [new TextRun({ text: 'export interface UncategorizedEntry {', color: '#E2E8F0', font: 'Consolas', size: 16 })] }),
                  new Paragraph({ children: [new TextRun({ text: '  timestamp: string;', color: '#A5B4FC', font: 'Consolas', size: 16 })] }),
                  new Paragraph({ children: [new TextRun({ text: '  port: number;', color: '#A5B4FC', font: 'Consolas', size: 16 })] }),
                  new Paragraph({ children: [new TextRun({ text: '  protocol: Protocol;', color: '#A5B4FC', font: 'Consolas', size: 16 })] }),
                  new Paragraph({ children: [new TextRun({ text: '  service: string;          // Nmap service name', color: '#A5B4FC', font: 'Consolas', size: 16 })] }),
                  new Paragraph({ children: [new TextRun({ text: '  product?: string;', color: '#A5B4FC', font: 'Consolas', size: 16 })] }),
                  new Paragraph({ children: [new TextRun({ text: '  version?: string;', color: '#A5B4FC', font: 'Consolas', size: 16 })] }),
                  new Paragraph({ children: [new TextRun({ text: '  banner?: string;', color: '#A5B4FC', font: 'Consolas', size: 16 })] }),
                  new Paragraph({ children: [new TextRun({ text: '  nseScripts?: { name: string; output: string }[];', color: '#A5B4FC', font: 'Consolas', size: 16 })] }),
                  new Paragraph({ children: [new TextRun({ text: '  hostIp: string;', color: '#A5B4FC', font: 'Consolas', size: 16 })] }),
                  new Paragraph({ children: [new TextRun({ text: '  scanId: string;           // ID сканирования', color: '#A5B4FC', font: 'Consolas', size: 16 })] }),
                  new Paragraph({ children: [new TextRun({ text: '  frequency: number;        // Сколько раз встречено', color: '#A5B4FC', font: 'Consolas', size: 16 })] }),
                  new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: '}', color: '#E2E8F0', font: 'Consolas', size: 16 })] }),
                ]
              })
            ]
          })
        ]
      }),
      
      new Paragraph({ spacing: { before: 200, after: 200 }, alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: 'Листинг 6. Интерфейс для неклассифицированных сервисов', italics: true, size: 20, color: colors.secondary })] }),
      
      new Paragraph({ spacing: { after: 200 }, children: [
        new TextRun({ text: 'OtherHandler сохраняет все неклассифицированные сервисы в IndexedDB с полным контекстом. Это позволяет ИБ-специалисту проанализировать "слепые зоны" базы знаний и добавить новые конфигурации. Поле frequency отслеживает, как часто встречается данный сервис, что помогает приоритизировать работу над новыми конфигами — сервисы с высокой частотой появления следует добавить в первую очередь.' })
      ]}),
      
      // Section 6: State Storage
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun('6. Хранение состояния для Offline-режима')] }),
      
      new Paragraph({ spacing: { after: 150 }, children: [
        new TextRun({ text: 'Полностью offline-режим работы накладывает специфические требования к хранению данных. Система должна обеспечивать персистентность между сессиями, быстрый доступ к результатам предыдущих сканирований и возможность экспорта/импорта данных. Рассмотрим оптимальные решения для каждого типа данных.' })
      ]}),
      
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('6.1. IndexedDB как основное хранилище')] }),
      
      new Paragraph({ spacing: { after: 150 }, children: [
        new TextRun({ text: 'IndexedDB является оптимальным выбором для offline-приложения на веб-стеке. Это транзакционная NoSQL база данных, встроенная в браузер, которая поддерживает индексы, транзакции и хранение бинарных данных. Для Electron/Tauri-приложений IndexedDB доступна через WebView, что делает решение универсальным. Рекомендуемая структура хранилищ:' })
      ]}),
      
      new Table({
        columnWidths: [2500, 3500, 3360],
        alignment: AlignmentType.CENTER,
        margins: { top: 100, bottom: 100, left: 180, right: 180 },
        rows: [
          new TableRow({
            tableHeader: true,
            children: [
              new TableCell({
                borders: cellBorders,
                shading: { fill: colors.headerBg, type: ShadingType.CLEAR },
                verticalAlign: VerticalAlign.CENTER,
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Хранилище', bold: true })] })]
              }),
              new TableCell({
                borders: cellBorders,
                shading: { fill: colors.headerBg, type: ShadingType.CLEAR },
                verticalAlign: VerticalAlign.CENTER,
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Данные', bold: true })] })]
              }),
              new TableCell({
                borders: cellBorders,
                shading: { fill: colors.headerBg, type: ShadingType.CLEAR },
                verticalAlign: VerticalAlign.CENTER,
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Индексы', bold: true })] })]
              })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun('scans')] })] }),
              new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun('Результаты Nmap сканирований')] })] }),
              new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun('timestamp, filename')] })] })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun('unclassified')] })] }),
              new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun('Unknown сервисы для анализа')] })] }),
              new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun('service, port, frequency')] })] })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun('userConfigs')] })] }),
              new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun('Пользовательские конфиги')] })] }),
              new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun('id, category')] })] })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun('sessionState')] })] }),
              new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun('UI state, фильтры, настройки')] })] }),
              new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun('key')] })] })
            ]
          })
        ]
      }),
      
      new Paragraph({ spacing: { before: 200, after: 200 }, alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: 'Таблица 1. Структура IndexedDB хранилищ', italics: true, size: 20, color: colors.secondary })] }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('6.2. Абстракция Storage Layer')] }),
      
      new Paragraph({ spacing: { after: 150 }, children: [
        new TextRun({ text: 'Для обеспечения переносимости между платформами (браузер, Electron, Tauri) рекомендуется создать абстрактный Storage Layer с унифицированным API. Это позволит в будущем заменить IndexedDB на SQLite (для Tauri) или файловую систему (для Electron) без изменения бизнес-логики.' })
      ]}),
      
      new Table({
        columnWidths: [9360],
        alignment: AlignmentType.CENTER,
        margins: { top: 50, bottom: 50, left: 100, right: 100 },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                borders: cellBorders,
                shading: { fill: '#1E293B', type: ShadingType.CLEAR },
                children: [
                  new Paragraph({ spacing: { before: 100 }, children: [new TextRun({ text: '// storage/StorageAdapter.ts', color: '#94A3B8', font: 'Consolas', size: 16 })] }),
                  new Paragraph({ children: [new TextRun({ text: 'export interface StorageAdapter {', color: '#E2E8F0', font: 'Consolas', size: 16 })] }),
                  new Paragraph({ children: [new TextRun({ text: '  get<T>(store: string, key: string): Promise<T | null>;', color: '#A5B4FC', font: 'Consolas', size: 16 })] }),
                  new Paragraph({ children: [new TextRun({ text: '  getAll<T>(store: string): Promise<T[]>;', color: '#A5B4FC', font: 'Consolas', size: 16 })] }),
                  new Paragraph({ children: [new TextRun({ text: '  put<T>(store: string, data: T, key?: string): Promise<void>;', color: '#A5B4FC', font: 'Consolas', size: 16 })] }),
                  new Paragraph({ children: [new TextRun({ text: '  delete(store: string, key: string): Promise<void>;', color: '#A5B4FC', font: 'Consolas', size: 16 })] }),
                  new Paragraph({ children: [new TextRun({ text: '  query<T>(store: string, index: string, range: IDBKeyRange): Promise<T[]>;', color: '#A5B4FC', font: 'Consolas', size: 16 })] }),
                  new Paragraph({ children: [new TextRun({ text: '  exportAll(): Promise<BackupData>;', color: '#A5B4FC', font: 'Consolas', size: 16 })] }),
                  new Paragraph({ children: [new TextRun({ text: '  importAll(data: BackupData): Promise<void>;', color: '#A5B4FC', font: 'Consolas', size: 16 })] }),
                  new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: '}', color: '#E2E8F0', font: 'Consolas', size: 16 })] }),
                ]
              })
            ]
          })
        ]
      }),
      
      new Paragraph({ spacing: { before: 200, after: 200 }, alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: 'Листинг 7. Интерфейс StorageAdapter', italics: true, size: 20, color: colors.secondary })] }),
      
      // Section 7: Implementation Roadmap
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun('7. Roadmap имплементации')] }),
      
      new Paragraph({ spacing: { after: 150 }, children: [
        new TextRun({ text: 'Реализация Configuration-Driven архитектуры требует планомерного подхода. Ниже представлен рекомендуемый порядок действий, разбитый на фазы. Каждая фаза заканчивается работающим прототипом, что позволяет итеративно развивать систему.' })
      ]}),
      
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('Фаза 1: Foundation (1-2 недели)')] }),
      
      new Paragraph({ numbering: { reference: 'numbered-3', level: 0 }, children: [new TextRun('Определить TypeScript интерфейсы для всех конфигураций')] }),
      new Paragraph({ numbering: { reference: 'numbered-3', level: 0 }, children: [new TextRun('Создать структуру директорий для конфигов')] }),
      new Paragraph({ numbering: { reference: 'numbered-3', level: 0 }, children: [new TextRun('Реализовать базовый StorageAdapter на IndexedDB')] }),
      new Paragraph({ numbering: { reference: 'numbered-3', level: 0 }, spacing: { after: 200 }, children: [new TextRun('Мигрировать существующий парсер Nmap на новый формат')] }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('Фаза 2: Engine Layer (2-3 недели)')] }),
      
      new Paragraph({ numbering: { reference: 'numbered-4', level: 0 }, children: [new TextRun('Реализовать ServiceMatcher с поддержкой всех типов триггеров')] }),
      new Paragraph({ numbering: { reference: 'numbered-4', level: 0 }, children: [new TextRun('Создать OtherHandler и систему логирования unknown сервисов')] }),
      new Paragraph({ numbering: { reference: 'numbered-4', level: 0 }, children: [new TextRun('Разработать RecommendationEngine на основе конфигов')] }),
      new Paragraph({ numbering: { reference: 'numbered-4', level: 0 }, spacing: { after: 200 }, children: [new TextRun('Добавить модульные тесты для всех компонентов движка')] }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('Фаза 3: Configuration Migration (1-2 недели)')] }),
      
      new Paragraph({ numbering: { reference: 'numbered-5', level: 0 }, children: [new TextRun('Вынести SERVICE_CATEGORIES из analyzer.ts в конфиги')] }),
      new Paragraph({ numbering: { reference: 'numbered-5', level: 0 }, children: [new TextRun('Создать конфигурации для основных сервисов (SMB, HTTP, SSH, RDP, MSSQL, AD)')] }),
      new Paragraph({ numbering: { reference: 'numbered-5', level: 0 }, children: [new TextRun('Перенести generateRecommendations в конфиг-ориентированный формат')] }),
      new Paragraph({ numbering: { reference: 'numbered-5', level: 0 }, spacing: { after: 200 }, children: [new TextRun('Удалить hardcoded логику из кода приложения')] }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('Фаза 4: Dynamic UI (2-3 недели)')] }),
      
      new Paragraph({ numbering: { reference: 'numbered-6', level: 0 }, children: [new TextRun('Реализовать Component Factory')] }),
      new Paragraph({ numbering: { reference: 'numbered-6', level: 0 }, children: [new TextRun('Создать конфигурируемые компоненты для рекомендаций')] }),
      new Paragraph({ numbering: { reference: 'numbered-6', level: 0 }, children: [new TextRun('Добавить UI для просмотра "Other" сервисов')] }),
      new Paragraph({ numbering: { reference: 'numbered-6', level: 0 }, spacing: { after: 200 }, children: [new TextRun('Реализовать экспорт/импорт конфигураций через UI')] }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('Фаза 5: Polish & Documentation (1-2 недели)')] }),
      
      new Paragraph({ numbering: { reference: 'numbered-7', level: 0 }, children: [new TextRun('Написать документацию для ИБ-специалистов по созданию конфигов')] }),
      new Paragraph({ numbering: { reference: 'numbered-7', level: 0 }, children: [new TextRun('Создать шаблоны конфигураций для популярных сервисов')] }),
      new Paragraph({ numbering: { reference: 'numbered-7', level: 0 }, children: [new TextRun('Оптимизировать производительность для больших сканов')] }),
      new Paragraph({ numbering: { reference: 'numbered-7', level: 0 }, children: [new TextRun('Финальное тестирование и подготовка к релизу')] }),
      
      // Conclusion
      new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 400 }, children: [new TextRun('Заключение')] }),
      
      new Paragraph({ spacing: { after: 200 }, children: [
        new TextRun({ text: 'Предложенная Configuration-Driven архитектура обеспечивает полную отделимость базы знаний от кода приложения. ИБ-специалисты получают возможность расширять систему без участия разработчиков, просто создавая новые TypeScript-конфигурации. Трёхуровневая архитектура (Data → Engine → Presentation) обеспечивает чистое разделение ответственности, а паттерн Component Factory позволяет динамически рендерить UI на основе конфигураций. Система обработки "Other" сервисов гарантирует, что никакие данные не теряются, а слепые зоны базы знаний легко идентифицируются для последующего расширения.' })
      ]}),
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync('/home/z/my-project/download/pentest-assistant-architecture.docx', buffer);
  console.log('Document created: /home/z/my-project/download/pentest-assistant-architecture.docx');
});
