# Implementación de Keycloak con Google y aplicación web

## 1. Introducción

Keycloak es una plataforma de código abierto para la gestión de identidades y accesos (IAM). Permite centralizar procesos de autenticación y autorización de aplicaciones, además de integrar proveedores externos de identidad mediante protocolos como OAuth 2.0, OpenID Connect y SAML.

En este ejercicio se implementó un entorno local utilizando Keycloak ejecutándose mediante Docker. Posteriormente se creó un Realm independiente del Realm `master`, se configuró Google como proveedor externo de identidad mediante OAuth 2.0 y se desarrolló una aplicación web sencilla utilizando Node.js.

La aplicación permite que un usuario se autentique mediante Keycloak y, posteriormente, muestra un mensaje personalizado con la información del usuario autenticado.

---

## 2. Objetivos

### 2.1. Objetivo general

Implementar un entorno local de autenticación utilizando Keycloak, integrarlo con Google como proveedor externo de identidad y desarrollar una aplicación web que utilice Keycloak para autenticar usuarios.

### 2.2. Objetivos específicos

- Ejecutar Keycloak utilizando Docker.
- Configurar persistencia de los datos de Keycloak.
- Crear un Realm personalizado.
- Crear un cliente OpenID Connect.
- Configurar Google como Identity Provider.
- Crear un rol básico para los usuarios.
- Desarrollar una aplicación web utilizando Node.js.
- Integrar la aplicación con Keycloak mediante OpenID Connect.
- Probar el proceso de autenticación mediante Google.
- Mostrar la información del usuario autenticado en la aplicación.

---

## 3. Arquitectura de la solución

La solución implementada utiliza tres componentes principales:

```text
┌──────────────────────┐
│        Google        │
│      OAuth 2.0       │
│ Proveedor de         │
│ identidad externo    │
└──────────┬───────────┘
           │
           │ Autenticación
           ▼
┌──────────────────────┐
│       Keycloak       │
│                      │
│ Realm: keycloak-demo │
│                      │
│ IAM + OpenID Connect │
└──────────┬───────────┘
           │
           │ OpenID Connect
           │ Authorization Code Flow
           ▼
┌──────────────────────┐
│     Dummy App        │
│       Node.js        │
│       Express        │
│  http://localhost:3000 │
└──────────────────────┘
```

### 3.1. Flujo de autenticación

1. El usuario accede a la aplicación web.
2. La aplicación verifica si existe una sesión autenticada.
3. Si no está autenticado, la aplicación redirige al usuario a Keycloak.
4. Keycloak presenta las opciones de autenticación disponibles.
5. El usuario selecciona **Google**.
6. Keycloak redirige al usuario hacia Google.
7. Google autentica al usuario.
8. Google devuelve la respuesta de autenticación a Keycloak.
9. Keycloak procesa la identidad del usuario.
10. Keycloak devuelve la respuesta de autenticación a la aplicación.
11. La aplicación procesa el código de autorización.
12. La aplicación obtiene la información del usuario.
13. Finalmente, se muestra el mensaje:

> **Hola Mundo, <usuario>**

### 3.2. Componentes y función

| Componente | Función |
|---|---|
| **Google** | Proveedor externo de identidad |
| **Keycloak** | Gestiona la autenticación, identidad y roles |
| **Node.js** | Ejecuta la aplicación web |
| **Express** | Gestiona el servidor HTTP y las rutas |
| **openid-client** | Implementa la comunicación OpenID Connect |
| **express-session** | Gestiona la sesión de la aplicación |
| **Docker** | Ejecuta Keycloak de forma aislada y reproducible |

---

## 4. Requisitos y entorno

- **Sistema operativo:** Ubuntu 26.04.1 LTS
- **Docker:** Docker Engine
- **Docker Compose:** utilizado para definir y ejecutar el servicio de Keycloak.
- **Node.js:** v22.22.1
- **npm:** v9.2.0

Luego de realizar la instalación de Docker, se comprobó su versión y funcionamiento.

> **Evidencia:** insertar aquí la captura correspondiente a la instalación y comprobación de Docker.

---

## 5. Implementación de Keycloak

### 5.1. Creación del directorio del proyecto

Se creó el directorio principal del proyecto:

```bash
mkdir ~/keycloak-assignment
cd ~/keycloak-assignment
```

### 5.2. Configuración de Docker Compose

Se creó el archivo `docker-compose.yml` con la siguiente configuración:

```yaml
services:
  keycloak:
    image: quay.io/keycloak/keycloak:latest
    container_name: keycloak
    command: start-dev
    environment:
      KC_BOOTSTRAP_ADMIN_USERNAME: admin
      KC_BOOTSTRAP_ADMIN_PASSWORD: admin123
    ports:
      - "8080:8080"
    volumes:
      - ./keycloak_data:/opt/keycloak/data
```

La configuración utiliza la imagen oficial de Keycloak y expone el servicio en el puerto `8080`.

También se configuró un volumen para mantener los datos de Keycloak aunque el contenedor sea reiniciado. El directorio utilizado para la persistencia es:

```text
keycloak_data/
```

### 5.3. Comprobación del contenedor

Se comprobó que el contenedor estuviera ejecutándose mediante:

```bash
docker ps
```

Keycloak quedó disponible en:

```text
http://localhost:8080
```

> **Evidencia:** insertar aquí la captura de `docker ps` y/o de Keycloak ejecutándose.

---

## 6. Creación del Realm

En Keycloak se creó un Realm independiente del Realm `master` para mantener aislada la configuración del ejercicio.

El Realm utilizado fue:

```text
keycloak-demo
```

---

## 7. Configuración de Google OAuth 2.0

Para permitir la autenticación mediante Google se utilizó Google Cloud y Google Auth Platform.

Se creó un cliente OAuth 2.0 de tipo **Aplicación web**. Este cliente permite que Keycloak delegue la autenticación en Google.

### 7.1. URI de redireccionamiento

La URI de redireccionamiento configurada fue:

```text
http://localhost:8080/realms/keycloak-demo/broker/google/endpoint
```

Esta URI corresponde al endpoint de Keycloak y no directamente a la aplicación Node.js.

---

## 8. Configuración de Google en Keycloak

Dentro del Realm `keycloak-demo` se configuró Google como proveedor de identidad.

### 8.1. Configuración principal

- **Alias:** `google`
- **Display name:** `Google`
- **Client ID:** obtenido desde Google Cloud.
- **Client Secret:** obtenido desde Google Cloud.

La URI de redireccionamiento generada por Keycloak fue:

```text
http://localhost:8080/realms/keycloak-demo/broker/google/endpoint
```

> **Importante:** el Client Secret es una credencial sensible y no debe publicarse en el repositorio.

---

## 9. Creación del cliente `dummy-app`

Dentro del Realm `keycloak-demo` se creó un cliente OpenID Connect para representar la aplicación web.

### 9.1. Configuración principal

| Parámetro | Valor |
|---|---|
| **Client ID** | `dummy-app` |
| **Name** | `Dummy Application` |
| **Client type** | OpenID Connect |

### 9.2. Flujos y opciones

- **Client authentication:** Off
- **Authorization:** Off
- **Standard flow:** On
- **Direct access grants:** Off
- **Implicit flow:** Off
- **Service accounts roles:** Off

El **Standard Flow** corresponde al flujo de autorización utilizado por la aplicación.

### 9.3. URLs

| Configuración | Valor |
|---|---|
| **Root URL** | `http://localhost:3000` |
| **Home URL** | `http://localhost:3000` |
| **Valid redirect URIs** | `http://localhost:3000/*` |
| **Valid post logout redirect URIs** | `http://localhost:3000/*` |
| **Web origins** | `http://localhost:3000` |

---

## 10. Creación del rol `user`

Para cumplir con el requisito de roles básicos, se creó un Realm Role denominado:

```text
user
```

Ruta:

```text
keycloak-demo
    ↓
Realm roles
    ↓
Create role
```

El rol se asignó posteriormente al usuario autenticado mediante Google.

Esto permite demostrar que Keycloak no solamente realiza la autenticación, sino que también permite gestionar autorización mediante roles.

> **Evidencia:** insertar aquí la captura de la creación del rol `user`.

---

## 11. Desarrollo de la aplicación

Para desarrollar la aplicación se utilizó **Node.js**.

### 11.1. ¿Por qué Node.js y Express?

Se utilizó Node.js porque permite ejecutar JavaScript del lado del servidor y crear rápidamente una aplicación web sencilla.

Express se utilizó como framework para Node.js porque facilita la creación del servidor HTTP y la definición de las rutas necesarias para el proceso de autenticación.

La aplicación no requiere una arquitectura compleja, ya que el objetivo principal del ejercicio es demostrar la integración con Keycloak.

### 11.2. Función de cada tecnología

| Tecnología | Función |
|---|---|
| **Node.js** | Ejecuta la aplicación en el servidor |
| **Express** | Gestiona el servidor HTTP y las rutas |
| **openid-client** | Implementa la comunicación con Keycloak mediante OpenID Connect |
| **express-session** | Mantiene la sesión del usuario en la aplicación |

### 11.3. Creación del proyecto

Se creó el directorio:

```bash
mkdir dummy-app
cd dummy-app
```

Se inicializó el proyecto:

```bash
npm init -y
```

Se instalaron las dependencias:

```bash
npm install express express-session openid-client
```
---

## 12. Configuración de OpenID Connect

La aplicación utiliza como proveedor de identidad el Realm de Keycloak:

```text
http://localhost:8080/realms/keycloak-demo
```

El Client ID utilizado es:

```text
dummy-app
```

La URI de callback de la aplicación es:

```text
http://localhost:3000/callback
```

El flujo implementado es:

```text
Authorization Code Flow
```

Durante el proceso de autenticación, la aplicación genera:

- `state`
- `nonce`
- `code_verifier`

Estos valores participan en la validación y protección del flujo de autenticación.

---

## 13. Funcionamiento de la aplicación

Cuando el usuario accede a:

```text
http://localhost:3000
```

la aplicación verifica si existe una sesión autenticada.

### 13.1. Usuario no autenticado

Si no existe una sesión, la aplicación muestra:

```text
Dummy Application

No estás autenticado.

Iniciar sesión con Keycloak
```

Al seleccionar el enlace de inicio de sesión, la aplicación redirige al usuario a Keycloak.

### 13.2. Proceso de autenticación

El flujo es:

```text
Usuario
   │
   ▼
Dummy Application
   │
   │ Solicitud de login
   ▼
Keycloak
   │
   │ Seleccionar Google
   ▼
Google
   │
   │ Usuario autenticado
   ▼
Keycloak
   │
   │ Authorization Code
   ▼
Dummy Application
   │
   │ Procesa código y obtiene identidad
   ▼
Sesión autenticada
   │
   ▼
"Hola Mundo, <usuario>"
```

Después de completar la autenticación, Keycloak devuelve al usuario a:

```text
http://localhost:3000/callback
```

La aplicación procesa el código de autorización y obtiene la información del usuario autenticado.

---

## 14. Resultado

Después de realizar correctamente la autenticación, la aplicación muestra la información del usuario autenticado y el mensaje:

```text
Hola Mundo, <usuario>
```

Esto demuestra que la aplicación recibió correctamente la información del usuario después del proceso de autenticación.

---

## 15. Conclusiones

La implementación permitió construir un entorno local de autenticación utilizando Keycloak y Docker.

Se creó un Realm independiente, se configuró Google como proveedor externo de identidad y se registró una aplicación mediante un cliente OpenID Connect.

La aplicación desarrollada con Node.js y Express permitió comprobar el flujo de autenticación de extremo a extremo, desde el acceso inicial del usuario hasta la recepción de su información autenticada.

Además, la creación del rol `user` permitió demostrar la utilización de Keycloak no solamente para autenticación, sino también para la gestión básica de autorización mediante roles.

---

