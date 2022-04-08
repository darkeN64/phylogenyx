# Generated by Django 4.0.3 on 2022-03-29 06:29

from django.db import migrations, models
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ('myapp', '0011_sequence_nexmltree_sequence_nexustree_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='sequence',
            name='one_sequence_length',
            field=models.CharField(default=django.utils.timezone.now, max_length=712364),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='sequence',
            name='sequence_count',
            field=models.CharField(default=django.utils.timezone.now, max_length=712364),
            preserve_default=False,
        ),
    ]
