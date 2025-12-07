from django.core.management.base import BaseCommand
from library.models import User

class Command(BaseCommand):
    help = 'Creates a default admin user if it does not exist'

    def handle(self, *args, **kwargs):
        username = 'zana-admin'
        email = 'admin@library.com'
        password = 'zanamaemira'  
        
        if not User.objects.filter(username=username).exists():
            User.objects.create_superuser(
                username=username,
                email=email,
                password=password,
                is_admin=True
            )
            self.stdout.write(self.style.SUCCESS(f'Default admin user created: {username}'))
        else:
            self.stdout.write(self.style.WARNING(f'Admin user "{username}" already exists'))