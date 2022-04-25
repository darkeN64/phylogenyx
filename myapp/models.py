from django.contrib.auth.models import User
from django.db import models
from django.apps import AppConfig
from django.utils.timezone import now


class Sequence(models.Model):
    id = models.AutoField(primary_key=True)
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    sequence = models.CharField(max_length=900000)
    tree = models.CharField(max_length=900000)
    phyloxmltree = models.CharField(max_length=900000)
    nexmltree = models.CharField(max_length=900000)
    nexustree = models.CharField(max_length=900000)
    one_sequence_length = models.CharField(max_length=100)
    sequence_count = models.CharField(max_length=100)
    options = models.CharField(max_length=200)
    gap_statistics = models.CharField(max_length=50000)
    date = models.DateTimeField(auto_now_add=True)

    def __unicode__(self):
        return u"%d %s %s %s %s %s" % (self.pk, self.name, self.sequence, self.tree, self.author, self.date)


