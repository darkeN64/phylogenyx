# Generated by Django 4.0.3 on 2022-03-27 22:31

from django.db import migrations, models
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ('myapp', '0006_alter_sequence_date'),
    ]

    operations = [
        migrations.AlterField(
            model_name='sequence',
            name='date',
            field=models.DateField(default=django.utils.timezone.now, editable=False),
        ),
    ]
