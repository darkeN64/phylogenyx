# Generated by Django 4.0.3 on 2022-03-28 10:12

from django.db import migrations, models
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ('myapp', '0010_alter_sequence_date'),
    ]

    operations = [
        migrations.AddField(
            model_name='sequence',
            name='nexmltree',
            field=models.CharField(default=django.utils.timezone.now, max_length=712364),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='sequence',
            name='nexustree',
            field=models.CharField(default=django.utils.timezone.now, max_length=712364),
            preserve_default=False,
        ),
        migrations.AlterField(
            model_name='sequence',
            name='date',
            field=models.DateTimeField(auto_now_add=True),
        ),
        migrations.AlterField(
            model_name='sequence',
            name='name',
            field=models.CharField(max_length=70),
        ),
        migrations.AlterField(
            model_name='sequence',
            name='sequence',
            field=models.CharField(max_length=712364),
        ),
        migrations.AlterField(
            model_name='sequence',
            name='tree',
            field=models.CharField(max_length=712364),
        ),
    ]