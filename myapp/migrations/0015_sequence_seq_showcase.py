# Generated by Django 4.0.3 on 2022-03-31 11:11

from django.db import migrations, models
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ('myapp', '0014_sequence_gap_statistics'),
    ]

    operations = [
        migrations.AddField(
            model_name='sequence',
            name='seq_showcase',
            field=models.CharField(default=django.utils.timezone.now, max_length=200),
            preserve_default=False,
        ),
    ]
