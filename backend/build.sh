#!/usr/bin/env bash
# Render Build Script for NexLearn Backend
# Exit on any error
set -o errexit

echo "==> Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

echo "==> Running migrations..."
python manage.py migrate --noinput

echo "==> Collecting static files..."
python manage.py collectstatic --noinput

echo "==> Creating superuser (if not exists)..."
python manage.py shell -c "
import os
from apps.users.models import User

username = os.environ.get('DJANGO_SUPERUSER_USERNAME', 'admin')
email = os.environ.get('DJANGO_SUPERUSER_EMAIL', 'admin@nexlearn.space')
password = os.environ.get('DJANGO_SUPERUSER_PASSWORD', 'Admin12345!')

if not User.objects.filter(username=username).exists():
    user = User.objects.create_superuser(
        username=username,
        email=email,
        password=password,
    )
    user.role = 'admin'
    user.first_name = 'Admin'
    user.last_name = 'NexLearn'
    user.save()
    print(f'Superuser \"{username}\" created successfully!')
else:
    print(f'Superuser \"{username}\" already exists, skipping.')
"

echo "==> Build complete!"
