@echo off
rem Adjust this path to your nginx installation
set NGINX_PATH=C:\nginx

rem Adjust this to your nginx.conf location
set NGINX_CONF=%CD%\nginx.conf

"%NGINX_PATH%\nginx.exe" -p "%NGINX_PATH%" -c "%NGINX_CONF%"
pause