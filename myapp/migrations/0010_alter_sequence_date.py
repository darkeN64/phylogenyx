# Generated by Django 4.0.3 on 2022-03-27 22:41

from django.db import migrations, models
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ('myapp', '0009_alter_sequence_date'),
    ]

    operations = [
        migrations.AlterField(
            model_name='sequence',
            name='date',
            field=models.DateTimeField(verbose_name=django.utils.timezone.now),
        ),
    ]
