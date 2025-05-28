@echo off
set NGINX_PATH=C:\nginx
rem Adjust this to your nginx.conf location
set NGINX_CONF=%CD%\nginx.conf

"%NGINX_PATH%\nginx.exe" -c "%NGINX_CONF%" -s stop
pause