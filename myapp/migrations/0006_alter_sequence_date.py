# Generated by Django 4.0.3 on 2022-03-27 22:24

from django.db import migrations, models
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ('myapp', '0005_alter_sequence_date'),
    ]

    operations = [
        migrations.AlterField(
            model_name='sequence',
            name='date',
            field=models.DateTimeField(default=django.utils.timezone.now, editable=False),
        ),
    ]
