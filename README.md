# Next JS Flask Set-up

Next JS Frontend Flask Backend Set-up

<br />

## Server Set-up
Create `api/` directory and inside it, create `index.py`

<br />

Create virtual environment

```bash
python3 -m venv my-env
```

<br />

Activate environment

```bash
source my-env/bin/activate
```

With your environment activated, you can now install pip packages within that environment

<br />

Create `.gitignore` file to the root of your folder and add your virtual environment folders and the pycache

```bash
# Virtual environments
/my-env

# Pycache
/api/__pycache__
```

<br />

Add `requirements.txt` from making sure the next person installs the requirements/packages recursively

```bash
pip freeze > requirements.txt
```

<br />

Add the following to your `next.config.js`

```JavaScript
/** @type {import('next').NextConfig} */
const nextConfig = {
    rewrites: async () => {
        return [
        {
            source: '/api/:path*',
            destination:
            process.env.NODE_ENV === 'development'
                ? 'http://127.0.0.1:8000/api/:path*'
                : '/api/',
        },
        ]
  },
}

module.exports = nextConfig
```

<br />

To run both servers simultaneously, install the following package

```bash
npm i concurrently
```

<br />

Navigate to the `"scripts"` property of your `package.json` and add the following:

```JSON
{
 "scripts": {
     "flask-dev": "FLASK_DEBUG=1 pip3 install -r requirements.txt && python3 -m flask --app api/index run -p 8000 --reload",
    "next-dev": "next dev",
    "dev": "concurrently \"npm run next-dev\" \"npm run flask-dev\""
  },
}
```

<br />

Run the project
```bash
npm run dev
```

<br />

## For the person cloning the project
Create virtual environment

```bash
python3 -m venv my-env
```

<br />

Activate environment

```bash
source my-env/bin/activate
```

<br />

Install the pip packages in requirements.txt

```bash
pip install -r requirements.txt
```

<br />

Install npm packages

```bash
npm install
```

<br />

## Sources
https://codevoweb.com/how-to-integrate-flask-framework-with-nextjs/


