# Generated by Django 4.0.3 on 2022-03-30 23:57

from django.db import migrations, models
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ('myapp', '0013_sequence_options'),
    ]

    operations = [
        migrations.AddField(
            model_name='sequence',
            name='gap_statistics',
            field=models.CharField(default=django.utils.timezone.now, max_length=6000),
            preserve_default=False,
        ),
    ]
