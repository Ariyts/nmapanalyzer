# NmapAnalyzer — Установка на Kali Linux

## Два способа запуска

### Способ 1: Собрать из исходников (рекомендуется)
### Способ 2: Просто открыть index.html (если уже собран)

---

## СПОСОБ 1: Сборка из исходников

### Шаг 1 — Установить Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
sudo apt-get install -y nodejs
node -v   # должно быть v20+
npm -v    # должно быть 10+
```

### Шаг 2 — Клонировать/скопировать проект

```bash
git clone <your-repo-url> nmap-analyzer
cd nmap-analyzer
```

### Шаг 3 — Установить зависимости

```bash
npm install
```

### Шаг 4 — Собрать

```bash
npm run build
```

### Шаг 5 — Открыть

```bash
xdg-open dist/index.html
# или
firefox dist/index.html
# или
chromium dist/index.html
```

---

## СПОСОБ 2: Просто открыть готовый файл

Если у тебя уже есть `dist/index.html` — просто открой его в браузере.
Никакого сервера не нужно. Всё работает офлайн.

```bash
firefox dist/index.html
```
